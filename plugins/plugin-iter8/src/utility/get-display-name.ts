// Dictionary to convert the metric config name -> Human readable
export default class NameDict {

	// Dictionary for metrics
	private metricDisplayNames = {
		"iter8_request_count": "Request Count",
		"iter8_total_latency": "Total Latency (sec)",
		"iter8_error_count": "Error Count",
		"iter8_mean_latency": "Mean Latency (sec)",
		"iter8_error_rate": "Error Rate"
	}

	// Dictionary for displaying Analytics Algorithms
	private algoDisplayNames = {
		unif: "Uniform Split"
	}

	/* 
	* === Methods to check the dictionary for a human readable name ===
	*/
	public getMetricName(configName: string) :string{
		if (configName in this.metricDisplayNames)
			return this.metricDisplayNames[configName]
		else{
			console.log("Metric name is not registed in the dictionary.");
			return configName
		}
	}
	public getAlgoName(algoName: string) :string {
		if(algoName in this.algoDisplayNames)
			return this.algoDisplayNames[algoName]
		else{
			console.log("Algorithm name is not registered in the dictionary.")
			return algoName
		}
	}
}