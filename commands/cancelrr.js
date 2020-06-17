const settings = require('../config.json');

module.exports = {
	name: 'cancelrr',
	description: 'Unregister a message from reaction roles',
	admin: true,
	execute(client, message, args) {
		if (args.length == 2) {
			let guild = client.guilds.cache.get(settings.guild_id);
			let channel = guild.channels.cache.find(ch => ch.name === args[0]);
			if (channel != null) {
				channel.messages.fetch(args[1])
					.then(rr_msg => {
						client.rroles.get(args[1]).then(rr_data => {
							if (rr_data != undefined) {
								client.rroles.delete(args[1]).then(() => {
									message.channel.send("The message has successfully been unregistered for reaction roles.")
								});
							} else {
								message.channel.send("That message isn't registered for reaction roles.");
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
			message.channel.send("Usage: `cancelrr [channel name] [message ID]`");
		}
	}
};
