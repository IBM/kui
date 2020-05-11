import { safeLoad } from 'js-yaml'

const execSync = require('child_process').execSync

export const iter8Metrics = {
  counter: ['iter8_request_count', 'iter8_total_latency', 'iter8_error_count'],
  ratio: ['iter8_mean_latency', 'iter8_error_rate']
}

export default class GetMetricConfig {
  public output = {}
  public constructor() {
    try {
      this.output = {
        configmaps: execSync('kubectl get configmaps -n iter8 iter8config-metrics -o yaml', {
          encoding: 'utf-8',
          stdio: 'pipe'
        })
      }
    } catch (err) {
      this.output = { error: err }
    }
  }

  public errorResponse() {
    if ({}.hasOwnProperty.call(this.output['error'], 'stderr')) {
      return {
        error: {
          message: [this.output['error']['stderr']],
          response: this.output['error']
        }
      }
    } else {
      return {
        error: {
          message: ['An error occured while trying to find available metrics'],
          response: this.output['error']
        }
      }
    }
  }

  public getMetricsConfigMap() {
    if ({}.hasOwnProperty.call(this.output, 'error')) {
      return this.errorResponse()
    }
    return this.output['configmaps']
  }

  public getCounterMetrics() {
    if ({}.hasOwnProperty.call(this.output, 'error')) {
      return this.errorResponse()
    }
    return safeLoad(safeLoad(this.output['configmaps'])['data']['counter_metrics.yaml'])
  }

  public getRatioMetrics() {
    if ({}.hasOwnProperty.call(this.output, 'error')) {
      return this.errorResponse()
    }
    return safeLoad(safeLoad(this.output['configmaps'])['data']['ratio_metrics.yaml'])
  }

  public getMetricList() {
    if ({}.hasOwnProperty.call(this.output, 'error')) {
      return this.errorResponse()
    }
    const list = { ratio: [], counter: [] }
    const rM = safeLoad(safeLoad(this.output['configmaps'])['data']['ratio_metrics.yaml'])
    const cM = safeLoad(safeLoad(this.output['configmaps'])['data']['counter_metrics.yaml'])
    rM.map(r => list.ratio.push(r['name']))
    cM.map(r => list.counter.push(r['name']))
    return list
  }
}
