const { emoji } = require("../config.json");
const { dbQueryNoNew, channelPermissions } = require("../coreFunctions");
const { Origins } = require("../utils/schemas");
module.exports = {
	controls: {
		permission: 2,
		usage: "setup",
		description: "Sets up a channel to publish announcements from",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let currentSettings = await dbQueryNoNew("Origins", {channelId: message.channel.id});
		if (currentSettings) return message.channel.send(`<:${emoji.x}> This channel is already setup as an announcement channel.`);
		if (message.channel.nsfw) return message.channel.send(`<:${emoji.x}> NSFW channels cannot be added as announcement channels.`);
		let channelPermMissing = channelPermissions(message.channel.memberPermissions(client.user.id), "origin");
		if (channelPermMissing && channelPermMissing.length >= 1) return message.channel.send(`<:${emoji.x}> This channel cannot be added as an announcement channel until the bot has the following permissions in this channel:\n- ${channelPermMissing.join("\n- ")}`);

		async function randomStr(len, arr) {
			let ans = "";
			for (let i = len; i > 0; i--) {
				ans +=
					arr[Math.floor(Math.random() * arr.length)];
			}
			let followCodeSearch = await dbQueryNoNew("Origins", {followCode: ans});
			if (followCodeSearch) return await randomStr(len, arr);
			else return ans;
		}

		let genCode = await randomStr(7, "123456abcdef");
		if (!genCode) return message.channel.send(`<:${emoji.x}> Uh oh! An internal error occurred. Please try running this command again. If the issue persists, contact our support team.`);

		await new Origins({
			guildId: message.guild.id,
			channelId: message.channel.id,
			followCode: genCode
		}).save();

		let embed = new Discord.RichEmbed()
			.setTitle(":loudspeaker: Announcement Channel Set Up")
			.setDescription("Messages from this channel can now be published to all servers that follow this channel through FollowBot.")
			.addField("How does following work?", `In any server with FollowBot, someone with the **Manage Server** or **Manage Webhooks** permission can use \`-follow ${genCode}\` to start receiving announcements!`)
			.addField("Additional Steps", `To publish a message, use the \`-publish\` command. If you would like to change the code used in \`-follow\` (currently \`${genCode}\`), use the \`-code\` command.`)
			.setColor("BLUE");
		message.channel.send(embed);
	}
};
