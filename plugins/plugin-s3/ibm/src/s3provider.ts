/*
 * Copyright 2021 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { REPL, eventChannelUnsafe } from '@kui-shell/core'
import { S3Provider, ProviderInitializer, UnsupportedS3ProviderError } from '@kui-shell/plugin-s3'

import Config from './model/Config'
import updateChannel from './channel'
import { isGoodConfig } from './controller/local'
import Geos, { GeoDefaults } from './model/geos'

const baseMountName = 'ibm'

class IBMCloudS3Provider implements S3Provider {
  public readonly endPoint: string
  public readonly directEndPoint: string

  public readonly region: string
  public readonly accessKey: string
  public readonly secretKey: string

  public readonly understandsFolders = true
  public readonly bucketNameNSlashes: 1
  public readonly listBuckets: S3Provider['listBuckets']

  public isDefault: boolean

  public constructor(
    private readonly geo: string,
    public readonly mountName: string,
    config?: Config,
    public readonly error?: Error
  ) {
    const accessKey = config ? config.AccessKeyID : undefined
    const secretKey = config ? config.SecretAccessKey : undefined

    this.endPoint = Geos[geo] || (config ? config.endpointForKui : undefined)
    this.region = geo
    this.accessKey = accessKey
    this.secretKey = secretKey

    // fast-path endpoint when executing in a cloud job?
    // e.g. s3.ap.cloud-object-storage.appdomain.cloud -> s3.direct.ap.cloud-object-storage.appdomain.cloud
    this.directEndPoint = this.endPoint.replace(/^s3\./, 's3.direct.')

    const defaultRegion = GeoDefaults[config['Default Region']] || config['Default Region']
    this.isDefault = config && geo === defaultRegion

    // use the closest available endpoint for listBuckets, since it is geo-agnostic
    this.listBuckets = {
      endPoint: config ? config.endpointForKui : Geos[geo],
      region: geo,
      accessKey,
      secretKey
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public bucketFilter({ name, locationConstraint }: { name: string; locationConstraint: string }): boolean {
    return !locationConstraint || locationConstraint.startsWith(this.geo)
  }
}

/** Listening for reconfigs? */
let listeningAlready = false
let currentConfig: Promise<{ content: void | Config }>

async function fetchConfig(repl: REPL): Promise<void | Config> {
  if (!currentConfig) {
    currentConfig = repl.rexec<void | Config>('ibmcloud cos validate')
  }

  return (await currentConfig).content
}

async function init(geo: string, mountName: string, repl: REPL, reinit: () => void) {
  try {
    if (!listeningAlready) {
      listeningAlready = true
      eventChannelUnsafe.on(updateChannel, () => {
        currentConfig = undefined
        reinit()
      })
    }

    const config = await fetchConfig(repl)
    listeningAlready = false
    if (!isGoodConfig(config)) {
      return new IBMCloudS3Provider(
        geo,
        mountName,
        undefined,
        new UnsupportedS3ProviderError('Could not find credentials')
      )
    } else {
      if (config && !config['Default Region']) {
        // TODO: isn't there a race here?
        config['Default Region'] = await repl.qexec('ibmcloud cos config region default')
      }
      const provider = new IBMCloudS3Provider(geo, mountName, config)
      if (provider.isDefault) {
        // add an /s3/ibm/default mount point
        const defaultProvider = new IBMCloudS3Provider(geo, 'ibm/default', config)
        defaultProvider.isDefault = true
        provider.isDefault = false
        return [defaultProvider, provider]
      } else {
        return provider
      }
    }
  } catch (err) {
    return new IBMCloudS3Provider(geo, mountName, undefined, new UnsupportedS3ProviderError(err.message))
  }
}

const initializer: ProviderInitializer[] = Object.keys(Geos)
  // .filter(_ => !/-geo$/.test(_)) // don't manifest geo endpoints in the VFS
  .map(geo => {
    const mountName = `${baseMountName}/${geo.replace(/-/g, '/')}`
    return {
      mountName,
      init: init.bind(undefined, geo, mountName)
    }
  })

export default initializer
