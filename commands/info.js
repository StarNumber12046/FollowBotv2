const { emoji } = require("../config.json");
const { dbQueryNoNew } = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 2,
		usage: "info",
		description: "Shows information about how to follow the announcement channel",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"]
	},
	do: async (message, client, args, Discord) => {
		let origin = await dbQueryNoNew("Origins", {channelId: message.channel.id});
		if (!origin) return message.channel.send(`<:${emoji.x}> This channel is not set up as an announcement channel!`);

		let embed = new Discord.RichEmbed()
			.setTitle(":loudspeaker: Follow This Channel in Your Server!")
			.setDescription("Important updates from this channel be published to all servers that follow this channel through FollowBot.")
			.addField("How can I follow?", `Add FollowBot to your server with [this link](https://discordapp.com/oauth2/authorize?client_id=671390125267353601&scope=bot&permissions=537259072). Once it's added, use \`-follow ${origin.followCode}\` in the channel you would like updates to be posted to. When an update it published, it will be sent to that channel!`)
			.setColor("BLUE");
		message.channel.send(embed);
	}
};
