const { emoji } = require("../config.json");
const { dbQueryNoNew, dbDeleteOne, dbQueryAll } = require("../coreFunctions");
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

		let subbedChannels = await dbQueryAll("Subscription", {followedChannelId: currentSettings.channelId});
		for (let i = 0; i < subbedChannels.length; i++) {
			let subChannel = subbedChannels[i];
			if (!client.channels.cache.get(subChannel.subscribedChannelId)) await dbDeleteOne("Subscription", {
				followedChannelId: currentSettings.channelId,
				subscribedChannelId: subChannel.subscribedChannelId
			});
			let hook = new Discord.WebhookClient(subChannel.webhook.id, subChannel.webhook.token);
			await hook.send(`This channel's subscription to **${message.guild.name} #${message.channel.name}** has been removed due to #${message.channel.name} being removed as an announcement channel.`).catch(async err => {
				await dbDeleteOne("Subscription", {followedChannelId: currentSettings.channelId, subscribedChannelId: subChannel.subscribedChannelId});
				return;
			});
			await hook.delete();
			await dbDeleteOne("Subscription", {followedChannelId: currentSettings.channelId, subscribedChannelId: subChannel.subscribedChannelId});
		}

		await dbDeleteOne("Origins", {channelId: message.channel.id});

		message.channel.send("This channel is no longer an announcement channel.");
	}
};
