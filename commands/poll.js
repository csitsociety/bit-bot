const Discord = require('discord.js');
const emojiRegex = require('emoji-regex');

const CSIT_ID = '332158176650854401';
const symbols = require('../symbols');
const functions = require('../functions');

function generateTestResults(options) {
	op = {...options};
	for (let i = 0; i < Object.keys(op).length; i++) {
		op[Object.keys(op)[i]] = Math.floor(Math.random() * 100);
	}
	return op;
}
function generateResults(options) {
	op = {...options};
	for (let i = 0; i < Object.keys(op).length; i++) {
		op[Object.keys(op)[i]] = 0;
	}
	return op;
}

module.exports = {
	name: 'poll',
	description: 'Run a poll in a specified channel using reactions',
	execute(client, message, args) {
		let poll_options = {};
		if (args.length > 0) {
			let guild = client.guilds.cache.get(CSIT_ID);
			let channel = guild.channels.cache.find(ch => ch.name === args.join(' '));
			if (channel != null) {
				message.channel.send(`Allow me to assist you with starting a poll in <#${channel.id}> today.\nIf you change your mind and wish to cancel, simply type \`stop\` at any point.`);

				message.channel.send('**Firstly**, what would you like to call the poll? (e.g. "Weekly Trivia Availability")');
				let stage = 0;
				options_index = 0;
				const collector = message.channel.createMessageCollector(m => m.author.id === message.author.id, { time: 300000 });

				collector.on('collect', m => {
					collector.resetTimer();
					if (m.content.toLowerCase() == 'stop' && stage != 4) {
						stage = 4;
						message.channel.send("I've cancelled the poll. To try again, type `poll " + args.join(' ') + "`.");
						collector.stop();
					}

					if (stage == 0) { // Name
						message.channel.send(`Ok, we'll call it "${m.content}".`);
						poll_options['name'] = m.content;
						stage = 1;
						message.channel.send("**Next**, write a description for your poll. You can type `none` if you don't need a description.");
					} else if (stage == 1) { // Description
						if (m.content.toLowerCase() === 'none') {
							message.channel.send(`No worries, I won't add a description to this poll.`);
							poll_options['description'] = '';
						} else {
							message.channel.send(`Sure, the description will be:\n"${m.content}"`);
							poll_options['description'] = m.content;
						}
						stage = 2;
						poll_options['options'] = {};
						message.channel.send("**Finally**, add some options to the poll. Send me up to 20 messages starting with the emoji to use at the start, or leave off an emoji to use letters.\ne.g. `:egg: Option with custom emoji`, or `Option with default emoji`\nWhen you're done, type `done`.");
					} else if (stage == 2) { // Options
						let done = false;
						if (m.content.toLowerCase() === 'done') {
							done = true;
						} else {
							let first = m.content.split(/ +/)[0];
							let regex = emojiRegex();
							if (regex.exec(first) == null) {
								poll_options['options'][symbols.default_emoji[options_index]] = m.content;
							} else {
								poll_options['options'][first] = m.content.replace(first, '').trim();
							}
							options_index++;
							message.channel.messages.fetch(m.id)
								.then(msg => msg.react('✅')).catch(e => console.log(e));
							if (options_index == 20) {
								done = true;
							}
						}
						if (done) {
							stage = 3;
							message.channel.send(`Great, that's everything! Here's an example of what the poll will look like in <#${channel.id}>, if you like it, go ahead and type \`ok\` and I'll post it.`);
							poll_options['results'] = generateResults(poll_options['options']);
							poll_options['creator'] = {
								'name': message.author.tag,
								'avatar': message.author.avatarURL({size: 32})
							};
							let exampleEmbed = new Discord.MessageEmbed()
								.setColor('#b22222')
								.setTitle(`Poll: ${poll_options['name']}`)
								.setFooter(`Poll created by ${message.author.tag}`, message.author.avatarURL({size: 32}))
								.addField('Options (react to vote)', functions.formatOptions(poll_options['options']))
								.addField('Results', functions.formatResults(generateTestResults(poll_options['options'])));
							if (poll_options['description'] != '') {
								exampleEmbed.setDescription(poll_options['description']);
							}
							message.channel.send(exampleEmbed);
						}
					} else if (stage == 3) {
						if (m.content.toLowerCase() === 'ok') {
							message.channel.startTyping();
							let embed = new Discord.MessageEmbed()
								.setColor('#b22222')
								.setTitle(`Poll: ${poll_options['name']}`)
								.setFooter(`Poll created by ${message.author.tag}`, message.author.avatarURL({size: 32}))
								.addField('Options (react to vote)', functions.formatOptions(poll_options['options']))
								.addField('Results', functions.formatResults(poll_options['results']));
							if (poll_options['description'] != '') {
								embed.setDescription(poll_options['description']);
							}
							channel.send(embed).then(msg => {
								client.polls.set(msg.id, poll_options);
								client.polls.get('all').then(all => {
									if (all == undefined) {
										all = [msg.id];
									} else {
										all.push(msg.id);
									}
									client.polls.set('all', all);
								});

								// Reactions
								let keys = Object.keys(poll_options['options']);
								keys.reduce((accumulatorPromise, nextKey) => {
									return accumulatorPromise.then(() => {
										return msg.react(nextKey);
									});
								}, Promise.resolve());

								message.channel.send(`I've successfully sent your poll to <#${channel.id}>. If you would like to close the poll, you can send me a dm with the message \`endpoll ${msg.id}\``);
							});
							stage = 4;
							collector.stop();
						}
					}
				});

				collector.on('end', collected => {
					if (stage != 4) {
						message.channel.send("It's been 5 minutes, so I've cancelled this. To try again, type `poll " + args.join(' ') + "`.");
					}
				});
			} else {
				message.channel.send(`I couldn't find a channel called "${args.join(' ')}" in the CSIT Society Discord server.`);
			}
		} else {
			message.channel.send("Usage: `poll [channel name]`");
		}
	},
};
