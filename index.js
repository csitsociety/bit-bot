const fs = require('fs');
const Discord = require('discord.js');
const Keyv = require('keyv');
const settings = require('./config.json');
const functions = require('./functions');
const {
  getAuthToken,
  getSpreadSheet,
  getSpreadSheetValues,
  appendSpreadSheetValue
} = require('./sheetService');

const client = new Discord.Client({
	partials: ['MESSAGE', 'REACTION'],
	restRequestTimeout: 120000, // 2 minutes
	retryLimit: 2,
});
client.commands = new Discord.Collection();
client.polls = new Keyv('sqlite://polls.sqlite');
client.rroles = new Keyv('sqlite://rroles.sqlite');

let studentregex = new RegExp('s[0-9]{7}');

const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const emotes = {
	"csit": "<:csit:679672128966098954>",
	"bit": "<:bit:724917600718422026>"
};

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);

	// Auto icon cron
	if (settings.auto_icon != '') {
		fs.access(__dirname + '/icons', function(err) {
			if (!err) {
				const icons = fs.readdirSync(__dirname + '/icons').filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.gif') || file.endsWith('.jpeg'));
				let CronJob = require('cron').CronJob;
				let job = new CronJob(
					settings.auto_icon,
					function() {
						if (icons.length > 0) {
							const icon = icons[Math.floor(Math.random() * icons.length)];
							let guild = client.guilds.cache.get(settings.guild_id);
							guild.setIcon(__dirname + '/icons/' + icon, 'Automatic icon change').then(u => console.log('Automatically updated the icon')).catch(console.error);
						}
					},
					null,
					true,
				);
			} else {
				console.error("Error: Auto icon is enabled but there is no icons directory");
			}
		});
	}
});

async function handleMemberAdd(member) {
	const introChannel = settings.intro_channel_id;
	// Send the message to a designated channel on a server:
	const channel = member.guild.channels.cache.find(ch => ch.id === introChannel);
	// Do nothing if the channel wasn't found on this server
	if (channel) {
		let serverWelcomes = [
			`\`Beep boop\`, ${member.user.tag} is here! ${emotes.bit}`,
			`\`Beep boop\`, ${member.user.tag} has arrived ${emotes.bit}`,
			`\`Beep boop\`, welcome ${member.user.tag} ${emotes.bit}`,
			`\`Beeep boop\`, hiya ${member.user.tag} ${emotes.bit}`
		];
		let embed = new Discord.MessageEmbed()
			.setColor('#b22222')
			.setDescription(serverWelcomes[Math.floor(Math.random() * serverWelcomes.length)]);
		channel.send(embed);
	}

	// Send DM with info
	let dm = new Discord.MessageEmbed()
		.setColor('#b22222')
		.setDescription(`\`Beep boop\`, it's me, Bit! I'm your friendly guide here at the CSIT Society discord server. When you get a chance, I'd love to get to know you better in <#${introChannel}>. 👋\n\n⚠ Before you do anything, please **[check out the rules](https://discordapp.com/channels/410734250309058560/461440685720076318/681418132258291712)** to learn about the server.\n\nDon't forget to have fun! ${emotes.csit}`);
	member.send(dm);
}

client.on('guildMemberAdd', handleMemberAdd);

client.on('message', async message => {
	if (message.channel.type !== 'dm' || message.author.bot) return;

	const args = message.content.split(/ +/);
	const command = args.shift().toLowerCase();

	if (client.commands.has(command)) {
		// Check role if commands requires admin
		if (client.commands.get(command).admin) {
			let guild = client.guilds.cache.get(settings.guild_id);
			let role = guild.roles.cache.find(r => r.name === settings.admin_role);
			let member = guild.member(message.author);
			if (!member.roles.cache.has(role.id)) {
				message.reply("You don't have permission to run this command.");
				return;
			}
		}

		try {
			client.commands.get(command).execute(client, message, args);
		} catch (error) {
			console.error(error);
			message.reply('Sorry, something went wrong trying to do that. :sob:');
		}
	} else if (studentregex.test(command)) {
		// Received student number
		message.channel.startTyping();

		try {
			const auth = await getAuthToken();

			// Get signup sheet data
			const signups_response = await getSpreadSheetValues({id: settings.verification.signup_sheet_id, auth, sheetName: settings.verification.signup_sheet_name});
			let signups = signups_response.data.values.slice(1);

			let found = false;
			for (let i = 0; i < signups.length; i++) {
				if (signups[i].length >= 3) {
					if (signups[i][2].toLowerCase().trim() === command.trim()) {
						found = true;
						break;
					}
				}
			}

			// Student number exists
			if (found) {
				let guild = client.guilds.cache.get(settings.guild_id);
				let role = guild.roles.cache.get(settings.verification.role_id);
				let member = guild.members.cache.get(message.author.id);
				if (role != null) {
					member.roles.add(role);
					message.channel.stopTyping();
					message.reply("Congrats! :tada: Thanks for verifying on Discord. You should now have the verified role in the CSIT Discord server. If you don't, contact an admin.");

					// Update spreadsheet
					let row = [
						`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
						message.author.tag,
						command,
						"Verified"
					];
					let verification_response = await appendSpreadSheetValue({id: settings.verification.verification_sheet_id, auth, sheetName: settings.verification.verification_sheet_name, row});
					if (verification_response.status != 200 || verification_response.data.updates.updatedRows != 1) {
						message.channel.stopTyping();
						message.reply("An error occurred while verifying, please contact an executive member and send them this message. [couldn't update sheet]");
						return;
					}
				} else {
					message.channel.stopTyping();
					message.reply("You qualify for verification but I couldn't assign you the role. Please contact an executive member for help and send them this message.");
				}
			} else {
				message.channel.stopTyping();
				message.reply("I've checked, and it looks like you aren't a member of CSIT! Sign up first using the form on our website and try this again.\n<https://csitsociety.club>");
			}
		} catch (e) {
			console.log("Catch error: ", e);
			message.channel.stopTyping();
			message.reply("An error occurred while verifying, please contact an executive member and send them this message. [sheets error]");
		}
		message.channel.stopTyping();
	}
});

async function handleReaction(reaction, user) {
	// Check if partial and fetch
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			return;
		}
	}
	client.polls.get('all').then(all => {
		if (all != undefined && all.includes(reaction.message.id)) {
			// Is an active poll
			let total = reaction.count - 1;
			client.polls.get(reaction.message.id).then(poll => {
				if (poll != undefined) {
					let valid_options = Object.keys(poll['options']);
					if (valid_options.includes(reaction.emoji.name)) {
						// Reaction is a valid option
						poll['results'][reaction.emoji.name] = total;
						client.polls.set(reaction.message.id, poll).then(() => {
							// Update embed
							let embed = functions.generatePollEmbed({
								name: poll['name'],
								description: poll['description'],
								author: poll['creator']['name'],
								avatar: poll['creator']['avatar'],
								options: functions.formatOptions(poll['options']),
								results: functions.formatResults(poll['results']),
								closed: false,
							});
							reaction.message.edit(embed);
						});
					}
				}
			});
		}
	});
	client.rroles.get(reaction.message.id).then(rr_data => {
		if (rr_data != undefined) {
			let valid_reactions = Object.keys(rr_data);
			if (valid_reactions.includes(reaction.emoji.name)) {
				// Reaction is assigned to a role
				let role = reaction.message.guild.roles.cache.find(r => r.name === rr_data[reaction.emoji.name]);
				if (role != null) {
					let member = reaction.message.guild.member(user);
					// Note: fetch() only retrieves 100 users, may need to limit responses if there are more reactions
					reaction.users.fetch().then(users_reacted => {
						if (users_reacted.get(user.id) != undefined) {
							member.roles.add(role);
						} else {
							member.roles.remove(role);
						}
					});
				}
			}
		}
	});
}

client.on('messageReactionAdd', handleReaction);
client.on('messageReactionRemove', handleReaction);

client.login(settings.token);
