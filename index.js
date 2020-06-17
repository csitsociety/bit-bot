const fs = require('fs');
const Discord = require('discord.js');
const Keyv = require('keyv');
const settings = require('./config.json');
const functions = require('./functions');

const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });
client.commands = new Discord.Collection();
client.polls = new Keyv('sqlite://polls.sqlite');

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const emotes = {
	"csit": "<:csit:679672128966098954>"
};

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberAdd', member => {
	// Send the message to a designated channel on a server:
	const channel = member.guild.channels.cache.find(ch => ch.name === 'general');
	// Do nothing if the channel wasn't found on this server
	if (!channel) return;
	const introChannel = settings.intro_channel_id;
	let welcomes = [
		`\`Beep boop\`, it is wonderful to see you-, yes, it's great to have you here ${member}! Please, tell us a bit about yourself in <#${introChannel}> \`boop\`? ${emotes.csit}`,
		`\`Beep boop\`, thank you- for joining our server! I am really glad you're here ${member}, and don't forget to introduce yourself in <#${introChannel}> \`beep\`. ${emotes.csit}`,
		`\`Beep boop\`, it's me, Bit! I'm your friendly guide here at the CSIT Society ${member}. I'd love to get to know you better-, in <#${introChannel}>? \`boop\`. ${emotes.csit}`,
		`\`Beeep boop\`, hiya ${member} and welcome to our server! Please-, share a bit about yourself in <#${introChannel}> so we can get to know you, \`beep\`. ${emotes.csit}`
	];
	channel.send(welcomes[Math.floor(Math.random() * welcomes.length)]);
});

client.on('message', message => {
	if (message.channel.type !== 'dm' || message.author.bot) return;

	const args = message.content.split(/ +/);
	const command = args.shift().toLowerCase();

	if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).execute(client, message, args);
	} catch (error) {
		console.error(error);
		message.reply('Sorry, something went wrong trying to do that. :sob:');
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
							let embed = new Discord.MessageEmbed()
								.setColor('#b22222')
								.setTitle(`Poll: ${poll['name']}`)
								.setFooter(`Poll created by ${poll['creator']['name']}`, poll['creator']['avatar'])
								.addField('Options (react to vote)', functions.formatOptions(poll['options']))
								.addField('Results', functions.formatResults(poll['results']));
							if (poll['description'] != '') {
								embed.setDescription(poll['description']);
							}
							reaction.message.edit(embed);
						});
					}
				}
			});
		}
	});
}

client.on('messageReactionAdd', handleReaction);
client.on('messageReactionRemove', handleReaction);

client.login(settings.token);
