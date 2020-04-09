const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./config.json');

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
	const introChannel = '415417332576288768';
	let welcomes = [
		`\`Beep boop, it is wonderful to see you-, yes, it's great to have you here \`${member}\`! Please, tell us a bit about yourself in \`<#${introChannel}>\` boop?\` ${emotes.csit}`,
		`\`Beep boop, thank you- for joining our server! I am really glad you're here \`${member}\`, and don't forget to introduce yourself in \`<#${introChannel}>\` beep.\` ${emotes.csit}`,
		`\`Beep boop, it's me, Bit! I'm your friendly guide here at the CSIT Society \`${member}\`. I'd love to get to know you better-, in \`<#${introChannel}>\`? boop.\` ${emotes.csit}`,
		`\`Beeep boop, hiya \`${member}\` and welcome to our server! Please-, share a bit about yourself in \`<#${introChannel}>\` so we can get to know you, beep.\` ${emotes.csit}`
	];
	channel.send(welcomes[Math.floor(Math.random() * welcomes.length)]);
});

client.login(settings.token);
