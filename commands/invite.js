const config = require("../config.json");
const { checkPermissions } = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 10,
		usage: "invite",
		description: "Shows the link to invite the bot",
		enabled: false,
		docs: "all/invite",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		return message.channel.send("You can invite FollowBot to your server with this link: https://discordapp.com/oauth2/authorize?client_id=671390125267353601&scope=bot&permissions=537259072");
	}
};
