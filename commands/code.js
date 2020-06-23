const { emoji } = require("../config.json");
const { dbQueryNoNew, dbModify } = require("../coreFunctions");
const { Origins } = require("../utils/schemas");
module.exports = {
	controls: {
		permission: 2,
		usage: "code (newcode)",
		description: "Changes the following code of an announcement channel",
		enabled: false,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let currentSettings = await dbQueryNoNew("Origins", {channelId: message.channel.id});
		if (!currentSettings) return message.channel.send(`<:${emoji.x}> This channel is not set up as an announcement channel!`);
		if (!args[0]) return message.channel.send(`This channel can be followed using \`-follow ${currentSettings.followCode}\``);
		if (args[0].length > 20) return message.channel.send(`<:${emoji.x}> Follow codes are limited to a length of 20 characters.`);

		let hasCode = await dbQueryNoNew("Origins", {followCode: args[0]});
		if (hasCode) return message.channel.send(`<:${emoji.x}> This follow code is already in use by another channel!`);

		await dbModify("Origins", {channelId: message.channel.id}, {followCode: args[0]});

		return message.channel.send(`<:${emoji.check}> This channel can now be followed using \`-follow ${args[0]}\`\n(Note: The previous code is now __invalid__)`);
	}
};
