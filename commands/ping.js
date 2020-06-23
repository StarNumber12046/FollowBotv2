const { colors, developer, support_invite } = require("../config.json");
const humanizeDuration = require("humanize-duration");
const ms = require("ms");
module.exports = {
	controls: {
		permission: 10,
		aliases: ["hi", "about", "bot"],
		usage: "ping",
		description: "Checks bot response time and shows information",
		enabled: true,
		docs: "all/ping",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord, p) => {
		if (p > 0) return message.channel.send((new Discord.RichEmbed().setTitle("Notice").setDescription(`As of June 23rd, 2020 FollowBot is being discontinued. See the [support server](https://discord.gg/${support_invite}) for more information.`).setColor("RED")));
		let developerArray = [];
		developer.forEach(developerId => {
			if (client.users.get(developerId)) {
				let user = client.users.get(developerId);
				developerArray.push(`${user.tag} (${user.id})`);
			} else developerArray.push(`Unknown User (${developerId})`);
		});
		let embed = new Discord.RichEmbed()
			.addField("Developer", developerArray.join("\n"))
			.addField("Guild Count", client.guilds.size)
			.addField("Uptime", humanizeDuration(client.uptime))
			.addField("Client Ping", client.ping + " ms")
			.setFooter(`${client.user.tag} v1.0.1`, client.user.displayAvatarURL)
			.setThumbnail(client.user.displayAvatarURL)
			.setColor("BLUE");
		message.reply("👋 Hi there! Here's some info:", embed).then((sent) => {
			embed.addField("Edit Time", ms(new Date().getTime() - sent.createdTimestamp));
			sent.edit("<@" + message.author.id + ">, 👋 Hi there! Here's some info:", embed);
		});
	}
};
