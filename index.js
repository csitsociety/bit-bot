const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./config.json');

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberAdd', member => {
	// Send the message to a designated channel on a server:
	const channel = member.guild.channels.cache.find(ch => ch.name === 'general');
	// Do nothing if the channel wasn't found on this server
	if (!channel) return;
	channel.send(`\`Beep boop, it is wonderful to see you-, yes, it's great to have you here \`${member}\`! Please, tell us a bit about yourself in \`<#415417332576288768>\` boop?\``);
});

client.login(settings.token);
