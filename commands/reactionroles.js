const Discord = require('discord.js');
const emojiRegex = require('emoji-regex');
const settings = require('../config.json');

const symbols = require('../symbols');

// Generates a summary of the reaction role config based on the rr object
function generateSummary(rr) {
	let summary = '';
	let keys = Object.keys(rr);
	for (let i = 0; i < keys.length; i++) {
		summary += `${keys[i]} -> @${rr[keys[i]]}\n`;
	}
	return summary;
}

module.exports = {
	name: 'reactionroles',
	description: 'Add roles to users based on reactions to a specific message',
	execute(client, message, args) {
		let rr_roles = {};
		if (args.length == 2) {
			let guild = client.guilds.cache.get(settings.guild_id);
			let channel = guild.channels.cache.find(ch => ch.name === args[0]);
			if (channel != null) {
				channel.messages.fetch(args[1])
					.then(rr_msg => {
						message.channel.send(`Ok let's get your message in <#${channel.id}> set up to recieve reactions.\nIf you change your mind and wish to cancel, simply type \`stop\` at any point.`);

						message.channel.send('All you need to do, is send me up to 20 emoji and role names, e.g. `:heart: Example role`. Make sure you type the name of the role correctly, without the `@` symbol. I\'ll react with ❌ if I can\'t find the role.\nWhen you\'re done, type `done` to finish.');
						let stage = 0;
						role_index = 0;
						const collector = message.channel.createMessageCollector(m => m.author.id === message.author.id, { time: 300000 }); // Timeout after 5 minutes

						collector.on('collect', m => {
							collector.resetTimer();
							if (m.content.toLowerCase() == 'stop' && stage != 2) {
								stage = 2;
								message.channel.send("I've cancelled it. To try again, type `reactionroles " + args.join(' ') + "`.");
								collector.stop();
							}

							if (stage == 0) { // Roles
								let done = false;
								if (m.content.toLowerCase() === 'done') {
									done = true;
								} else {
									let first = m.content.split(/ +/)[0];
									let regex = emojiRegex();
									let role_name = '';
									if (regex.exec(first) == null) {
										role_name = m.content;
									} else {
										role_name = m.content.replace(first, '').trim();
									}
									let role = guild.roles.cache.find(r => r.name === role_name);
									if (role != null) {
										let regex = emojiRegex();
										if (regex.exec(first) == null) {
											rr_roles[symbols.default_emoji[role_index]] = role_name;
										} else {
											rr_roles[first] = role_name;
										}
										role_index++;
										message.channel.messages.fetch(m.id)
											.then(msg => msg.react('✅')).catch(e => console.log(e));
									} else {
										message.channel.messages.fetch(m.id)
											.then(msg => msg.react('❌')).catch(e => console.log(e));
									}
									if (role_index == 20) {
										done = true;
									}
								}
								if (done) {
									stage = 1;
									message.channel.send(`Great, that's everything! Here's a summary of the roles you chose, if you like it, go ahead and type \`ok\` and I'll enable it.`);
									let embed = new Discord.MessageEmbed()
										.setColor('#b22222')
										.setTitle('Reaction role summary')
										.setDescription(generateSummary(rr_roles))
										.setFooter(`Applying to message with ID "${args[1]}"`);
									message.channel.send(embed);
								}
							} else if (stage == 1) { // Done
								if (m.content.toLowerCase() === 'ok') {
									// Reactions
									let keys = Object.keys(rr_roles);
									keys.reduce((accumulatorPromise, nextKey) => {
										return accumulatorPromise.then(() => {
											return rr_msg.react(nextKey);
										});
									}, Promise.resolve());

									client.rroles.set(args[1], rr_roles);
									message.channel.send(`I've successfully set up reaction roles in <#${channel.id}> for the specified message. If you would like to unregister this message, you can send me a dm with the message \`cancelrr ${args.join(' ')}\``);
									stage = 2;
									collector.stop();
								}
							}
						});

						collector.on('end', collected => {
							if (stage != 2) {
								message.channel.send("It's been 5 minutes, so I've cancelled this. To try again, type `reactionroles " + args.join(' ') + "`.");
							}
						});
					})
					.catch(() => {
						message.channel.send(`I couldn't find that message in <#${channel.id}>, check that the message ID you are using is correct.`);
					});
			} else {
				message.channel.send(`I couldn't find a channel called "${args[0]}" in the CSIT Society Discord server.`);
			}
		} else {
			message.channel.send("Usage: `reactionroles [channel name] [message ID]`");
		}
	},
};
