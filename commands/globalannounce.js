const { emoji, log_hooks, support_invite } = require("../config.json");
const { dbQueryNoNew, dbQueryAll, dbDeleteOne, fetchUser, dbModify } = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 0,
		usage: "globalannounce <message ID>",
		aliases: ["gannounce"],
		description: "Publishes a message to every announcement channel - MUST BE USED IN THE CHANNEL WITH THE ANNOUNCEMENT",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (!args[0]) return message.channel.send(`<:${emoji.x}> You must specify the message ID of the message you are sending!`);
		let guild = message.guild;
		let channel = message.channel;

		let invite = "";
		await channel.createInvite({maxAge: 0}).then(genInv => {
			invite = genInv.code;
		}).catch(err => {
			return message.channel.send(`<:${emoji.x}> There was an error creating an invite to this channel.`);
		});

		message.channel.messages.fetch(args[0]).then(async fetchedMsg => {

			let attachments = [];
			if (fetchedMsg.attachments.first()) fetchedMsg.attachments.forEach(attachment => {
				attachments.push(attachment.url);
			});
			let msgEmbed = fetchedMsg.embeds;
			let embedlist = [];
			if (msgEmbed.length > 0) {
				if (msgEmbed.length < 10) msgEmbed.forEach(e => {
					if (e.type === "rich") embedlist.push(new Discord.MessageEmbed(e));
					else if (e.type === "image") attachments.push(e.url);
				});
				else return message.channel.send(`<:${emoji.x}> Due to Discord embed limitations, messages with over 9 embeds cannot be published.`);
			}

			embedlist.push({
				description: `You can join the FollowBot support server at: https://discord.gg/${support_invite}`,
				author: {
					name: "This message was published globally by the FollowBot Team.",
					icon_url: client.user.displayAvatarURL()
				}
			});
			await (new Discord.WebhookClient(log_hooks.publish.id, log_hooks.publish.token)).send(fetchedMsg.cleanContent, {disableEveryone: true,
				embeds: embedlist,
				files: attachments
			});
			let subbedChannels = await dbQueryAll("Subscription", {});
			for (let i = 0; i < subbedChannels.length; i++) {
				let subChannel = subbedChannels[i];
				if (client.channels.cache.get(subChannel.subscribedChannelId)) {
					let hook = new Discord.WebhookClient(subChannel.webhook.id, subChannel.webhook.token);
					await hook.send(fetchedMsg.cleanContent, {
						disableEveryone: true,
						embeds: embedlist,
						files: attachments,
						avatarURL: client.user.displayAvatarURL(),
						username: "FollowBot Global Announcement"
					}).catch(async err => {
						return;
					});
				}
			}
			message.channel.send(`<:${emoji.check}> Announcement published globally`);

		}).catch(err => {
			console.log(err);
			return message.channel.send(`<:${emoji.x}> The message ID you specified was invalid!`);
		});
	}
};
