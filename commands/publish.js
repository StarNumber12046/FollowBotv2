const { emoji, log_hooks } = require("../config.json");
const { dbQueryNoNew, dbQueryAll, dbDeleteOne, fetchUser, dbModify } = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 2,
		usage: "publish <code> <message ID>",
		description: "Publishes a message in an announcement channel",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (!args[0]) return message.channel.send(`<:${emoji.x}> You must specify the follow code of the channel you're sending the message from!`);
		let origin = await dbQueryNoNew("Origins", {followCode: args[0], guildId: message.guild.id});
		if (!origin) return message.channel.send(`<:${emoji.x}> That is an invalid follow code! Make sure that you are using the correct casing.`);
		if (!args[1]) return message.channel.send(`<:${emoji.x}> You must specify the message ID of the message you are sending!`);
		if (!client.guilds.get(origin.guildId) || !client.channels.get(origin.channelId)) return message.channel.send(`<:${emoji.x}> The origin announcement channel could not be fetched - please try again later.`);
		if (!client.channels.get(origin.channelId)) return message.channel.send(`<:${emoji.x}> The channel that this follow code is linked to could not be found!`);
		let guild = client.guilds.get(origin.guildId);
		let channel = client.channels.get(origin.channelId);

		if (channel.nsfw) return message.channel.send(`<:${emoji.x}> Messages cannot be published from NSFW channels.`);

		let invite = "";
		await channel.createInvite({maxAge: 0}).then(genInv => {
			invite = genInv.code;
		}).catch(err => {
			return message.channel.send(`<:${emoji.x}> There was an error creating an invite to your announcement channel.`);
		});

		if (origin.published.includes(args[1])) return message.channel.send(`<:${emoji.x}> This message has already been published.`);
		client.channels.get(origin.channelId).fetchMessage(args[1]).then(async fetchedMsg => {
			let textToSend = fetchedMsg.content;
			// eslint-disable-next-line no-useless-escape
			textToSend.split("@everyone").join("@\everyone");

			async function sanitize(input) {
				let userMatches = input.match(/<@!?(\d+)>/g) || [];
				let channelMatches = input.match(/<#!?(\d+)>/g) || [];
				let roleMatches = input.match(/<@&(\d+)>/g) || [];
				let list = userMatches.concat(channelMatches).concat(roleMatches);
				let text = input;
				for (let item of list) {
					let uid;
					let cid;
					let rid;
					await item.match(/^<@!?(\d+)>$/) ? uid = item.match(/^<@!?(\d+)>$/)[1] : uid = null;
					await item.match(/^<#(\d+)>$/) ? cid = item.match(/^<#(\d+)>$/)[1] : cid = null;
					await item.match(/^<@&(\d+)>$/) ? rid = item.match(/^<@&(\d+)>$/)[1] : rid = null;

					if (uid) {
						let user = await fetchUser(uid, client);
						if (user) text = text.replace(item, `@${user.username}`);
						else text = text.replace(item, `@${uid}`);
					} else if (cid) {
						let channel = `<#${cid}>`;
						if (client.channels.get(cid)) channel = `#${client.channels.get(cid).name}`;
						text = text.replace(item, channel);
					} else if (rid) {
						let role = `<@&${rid}>`;
						if (client.guilds.get(origin.guildId).roles.get(rid)) role = `@${client.guilds.get(origin.guildId).roles.get(rid).name}`;
						text = text.replace(item, role);
					}
				}
				return text;
			}

			let attachments = [];
			if (fetchedMsg.attachments.first()) fetchedMsg.attachments.forEach(attachment => {
				attachments.push(attachment.url);
			});
			let msgEmbed = fetchedMsg.embeds;
			let embedlist = [];
			if (msgEmbed.length > 0) {
				if (msgEmbed.length < 10) msgEmbed.forEach(e => {
					if (e.type === "rich") embedlist.push(new Discord.RichEmbed(e))
					else if (e.type === "image") attachments.push(e.url)
				});
				else return message.channel.send(`<:${emoji.x}> Due to Discord embed limitations, messages with over 9 embeds cannot be published.`);
			}
			let sanitizedText = await sanitize(textToSend);
			embedlist.push({
				description: `You can join this server by using this invite: https://discord.gg/${invite}`,
				author: {
					name: `This message was published by ${guild.name}.`,
					icon_url: guild.iconURL.replace(".jpg", ".png")
				},
				footer: {
					text: "FollowBot is not responsible for any text sent through this publishing service."
				}
			});
			await (new Discord.WebhookClient(log_hooks.publish.id, log_hooks.publish.token)).send(sanitizedText, {disableEveryone: true,
				embeds: embedlist,
				files: attachments
			});
			let subbedChannels = await dbQueryAll("Subscription", {followedChannelId: origin.channelId});
			for (let i = 0; i < subbedChannels.length; i++) {
				let subChannel = subbedChannels[i];
				if (!client.channels.get(subChannel.subscribedChannelId)) await dbDeleteOne("Subscription", {
					followedChannelId: origin.channelId,
					subscribedChannelId: subChannel.subscribedChannelId
				});
				let hook = new Discord.WebhookClient(subChannel.webhook.id, subChannel.webhook.token);
				await hook.send(sanitizedText, {disableEveryone: true,
					embeds: embedlist,
					files: attachments,
					avatarURL: guild.iconURL,
					username: `${guild.name} • #${channel.name}`
				}).catch(async err => {
					if (client.channels.get(subChannel.subscribedChannelId)) client.channels.get(subChannel.subscribedChannelId).send(`This channel's subscription to **${guild.name} #${channel.name}** has been removed due to the webhook in this channel being removed. You can re-follow this channel by using \`-follow ${origin.followCode}\``);
					await dbDeleteOne("Subscription", {followedChannelId: origin.channelId, subscribedChannelId: subChannel.subscribedChannelId});
					return;
				});
			}
			if (!origin.published) origin.published = [];
			origin.published.push(fetchedMsg.id);
			await dbModify("Origins", {followCode: origin.followCode, guildId: origin.guildId, channelId: origin.channelId}, origin);
			message.channel.send(`<:${emoji.check}> Announcement published`);
		}).catch(err => {
			console.log(err);
			return message.channel.send(`<:${emoji.x}> The message ID you specified was invalid!`);
		});
	}
};
