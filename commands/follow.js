const { emoji } = require("../config.json");
const { dbQueryNoNew, channelPermissions } = require("../coreFunctions");
const { Subscription } = require("../utils/schemas");
module.exports = {
	controls: {
		permission: 2,
		usage: "follow <code>",
		description: "Follows an announcement channel",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (!args[0]) return message.channel.send(`<:${emoji.x}> You must specify a follow code! You should be able to find it in the channel you're trying to subscribe to.`);
		let origin = await dbQueryNoNew("Origins", {followCode: args[0]});
		if (!origin) return message.channel.send(`<:${emoji.x}> That is an invalid follow code! Make sure that you are using the correct casing.`);
		let alreadySubscribed = await dbQueryNoNew("Subscription", {followedChannelId: origin.channelId, subscribedChannelId: message.channel.id});
		if (alreadySubscribed) return message.channel.send(`<:${emoji.x}> This channel is already following that channel!`);
		let channelPermMissing = channelPermissions(message.channel.memberPermissions(client.user.id), "subscribe");
		if (channelPermMissing && channelPermMissing.length >= 1) return message.channel.send(`<:${emoji.x}> This channel cannot be added as an following channel until the bot has the following permissions in this channel:\n- ${channelPermMissing.join("\n- ")}`);
		if (!client.guilds.get(origin.guildId) || !client.channels.get(origin.channelId)) return message.channel.send(`<:${emoji.x}> The origin announcement channel could not be fetched - please try again later.`);
		let guild = client.guilds.get(origin.guildId);
		let channel = client.channels.get(origin.channelId);
		message.channel.createWebhook(`${guild.name} • #${channel.name}`, guild.iconURL ? guild.iconURL.replace(".jpg", ".png") : null).then(async webhook => {
			await new Subscription({
				subscribedGuildId: message.guild.id,
				subscribedChannelId: message.channel.id,
				followedGuildId: origin.guildId,
				followedChannelId: origin.channelId,
				webhook: {
					id: webhook.id,
					token: webhook.token
				}
			}).save();

			webhook.send(`:loudspeaker: This channel is now following the **#${channel.name}** channel of **${guild.name}**! Published announcements will be sent here!`);
		}).catch(error => {
			return message.channel.send(`<:${emoji.x}> There was an error creating a webhook for announcements. Please make sure that the bot has permission and this channel has less than 10 webhooks.`);
		});
	}
};
