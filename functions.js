const Discord = require('discord.js');
const symbols = require('./symbols');

module.exports = {
	// Turn an options object into a formatted list to display in the embed
	formatOptions(options) {
		let formatted = '';
		let keys = Object.keys(options);
		for (let i = 0; i < keys.length; i++) {
			formatted += `${keys[i]} ${options[keys[i]]}\n`;
		}
		return formatted;
	},
	// Turns a results object into fancy progress bars and sorts by top voted
	formatResults(results) {
		let keys = Object.keys(results).sort((a,b) => {return results[b]-results[a]});
		let formatted = '';
		let total = Object.values(results).reduce((a, b) => a + b);
		for (let i = 0; i < keys.length; i++) {
			let count = results[keys[i]];
			let progress = 0;
			if (total != 0) {
				progress = Math.floor((count/total)*100);
			}
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
	// Generate an embed object based on poll data
	generatePollEmbed(data) {
		let embed = new Discord.MessageEmbed()
			.setColor('#b22222')
			.setTitle(`${data['closed'] ? '[CLOSED] ' : ''}Poll: ${data['name']}`)
			.setFooter(`Poll created by ${data['author']}`, data['avatar'])
			.addField(`Options${data['closed'] ? '' : ' (react to vote)'}`, data['options'])
			.addField('Results', data['results']);
		if (data['description'] != '') {
			embed.setDescription(data['description']);
		}
		return embed;
	},
};
