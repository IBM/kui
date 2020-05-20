import { safeLoad, safeDump } from 'js-yaml'
import { applyKube } from './traffic-split'
import { MetricTypes } from '../modes/get-metrics'

const execSync = require('child_process').execSync

export default function deleteMetric(metricName: string, type: MetricTypes) {
  let configmap = {}
  
  try {
    configmap = execSync('kubectl get configmaps -n iter8 iter8config-metrics -o yaml', {
      encoding: 'utf-8',
      stdio: 'pipe'
    })
  } catch (err) {
    configmap = { error: err }
  }

  if (!{}.hasOwnProperty.call(configmap, 'error')) {
    const rM = safeLoad(safeLoad(configmap)['data']['ratio_metrics.yaml'])
    const cM = safeLoad(safeLoad(configmap)['data']['counter_metrics.yaml'])
    const newconfigmap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'iter8config-metrics',
        namespace: 'iter8',
        annotations: {
          version: '1.0.0'
        }
      },
      data: {}
    }

    if (type === null) {
      for (let i = 0; i < cM.length; i++) {
        if (cM[i].name === metricName) {
          type = MetricTypes.counter
          break
        }
      }
    }

    if (type === null) {
      type = MetricTypes.ratio
    }

    let deleted = ''
    if (type === MetricTypes.counter) {
      for (let i = 0; i < cM.length; i++) {
        if (cM[i].name === metricName) {
          deleted = cM[i].name
          cM.splice(i, 1)
          break
        }
      }
    } else {
      for (let i = 0; i < rM.length; i++) {
        if (rM[i].name === metricName) {
          deleted = rM[i].name
          rM.splice(i, 1)
          break
        }
      }
    }

    newconfigmap.data['counter_metrics.yaml'] = safeDump(cM)
    newconfigmap.data['ratio_metrics.yaml'] = safeDump(rM)

    applyKube(newconfigmap)
    return { success: deleted }
  }
}
