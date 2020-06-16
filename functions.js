const symbols = require('./symbols');

module.exports = {
	formatOptions(options) {
		let formatted = '';
		let keys = Object.keys(options);
		for (let i = 0; i < keys.length; i++) {
			formatted += `${keys[i]} ${options[keys[i]]}\n`;
		}
		return formatted;
	},
	formatResults(results) {
		let keys = Object.keys(results).sort(function(a,b){return results[b]-results[a]});
		let formatted = '';
		let total = Object.values(results).reduce((a, b) => a + b);
		for (let i = 0; i < keys.length; i++) {
			let count = results[keys[i]];
			let progress = Math.floor((count/total)*100);
			let progress_bar = '';
			for (let j = 1; j <= 10; j++) {
				if (progress >= (j*10)) {
					progress_bar += symbols.progress.full;
				} else if (progress >= (j*10)-5 && progress < (j*10)) {
					progress_bar += symbols.progress.half;
				} else {
					progress_bar += symbols.progress.empty;
				}
			}

			formatted += `${keys[i]} ${progress_bar} ${progress}% (${count})\n`;
		}
		return formatted;
	},
};
