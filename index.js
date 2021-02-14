const fs = require('fs');
const Discord = require('discord.js');
const Keyv = require('keyv');
const settings = require('./config.json');
const functions = require('./functions');

const client = new Discord.Client({
	partials: ['MESSAGE', 'REACTION'],
	restRequestTimeout: 120000, // 2 minutes
	retryLimit: 2,
});
client.commands = new Discord.Collection();
client.polls = new Keyv('sqlite://polls.sqlite');
client.rroles = new Keyv('sqlite://rroles.sqlite');

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
		channel.send(`\`Member joined: ${member.user}\``);
	}
	console.log(`Member joined: ${member.user.tag}`);
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
	} else {
		message.reply('`I am Bit`');
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
