const { colors } = require("../config.json");
const { dbQueryAll, dbQueryNoNew } = require("../coreFunctions");
const humanizeDuration = require("humanize-duration");
module.exports = {
	controls: {
		permission: 10,
		usage: "stats",
		aliases: ["statistics"],
		description: "Shows statistics for an announcement channel",
		enabled: true,
		docs: "all/stats",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (!args[0]) return message.channel.send("You must specify a follow code!");
		let origin = await dbQueryNoNew("Origins", {followCode: args[0], guildId: message.guild.id});
		if (!origin) return message.channel.send("You must specify a valid follow code!");
		if (!client.channels.get(origin.channelId)) return message.channel.send("The announcement channel could not be fetched!");
		let subbedChannels = await dbQueryAll("Subscription", {followedChannelId: origin.channelId});
		let statEmbed = new Discord.RichEmbed()
			.setTitle(`#${client.channels.get(origin.channelId).name} Announcement Statistics`)
			.setDescription(`Followed by **${subbedChannels.length}** channels\n**${origin.published.length}** announcements published`)
			.setColor("BLUE");
		message.channel.send(statEmbed);
		return;
	}
};
