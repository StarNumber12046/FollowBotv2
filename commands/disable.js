const { emoji } = require("../config.json");
const { dbQueryNoNew, dbDeleteOne } = require("../coreFunctions");
const { Origins } = require("../utils/schemas");
module.exports = {
	controls: {
		permission: 2,
		usage: "disable",
		description: "Disables a channel as an announcement channel",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let currentSettings = await dbQueryNoNew("Origins", {channelId: message.channel.id});
		if (!currentSettings) return message.channel.send(`<:${emoji.x}> This channel is not set up as an announcement channel!`);

		await dbDeleteOne("Origins", {channelId: message.channel.id});

		message.channel.send("This channel is no longer an announcement channel.");
	}
};
