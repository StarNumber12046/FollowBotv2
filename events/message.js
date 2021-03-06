//this is a change
const core = require("../coreFunctions.js");
const { dbQuery, dbModifyId, dbDeleteOne, dbModify } = require("../coreFunctions");
const { emoji, support_invite } = require("../config.json");
const config = require("../config.json");
const permissionNames = require("../utils/permissions.json");
module.exports = async (Discord, client, message) => {
	if (message.channel.type !== "text") {
		if (message.channel.type === "dm" && client.user.id !== message.author.id) return core.coreLog(":e_mail: **" + message.author.tag + "** (" + message.author.id + ") sent a DM to the bot:\n" + message.content, client);
		return;
	}
	if (message.author.bot === true) return;

	let permission = await core.checkPermissions(message.member, client);

	let prefix = config.prefix;

	let possiblementions = [`<@${client.user.id}> help`, `<@${client.user.id}>help`, `<@!${client.user.id}> help`, `<@!${client.user.id}>help`, `<@${client.user.id}> prefix`, `<@${client.user.id}>prefix`, `<@!${client.user.id}> prefix`, `<@!${client.user.id}>prefix`, `<@${client.user.id}> ping`, `<@${client.user.id}>ping`, `<@!${client.user.id}> ping`, `<@!${client.user.id}>ping`];
	if (possiblementions.includes(message.content.toLowerCase())) return message.reply(`Hi there! My prefix is ${Discord.escapeMarkdown(prefix)}\nUse \`-help\` for more information about my commands!`);

	if (permission <= 1 && message.content.toLowerCase().startsWith("followbot:")) prefix = "followbot:";
	if (permission <= 1 && message.content.toLowerCase().startsWith(`${client.user.id}:`)) prefix = `${client.user.id}:`;
	if (!message.content.toLowerCase().startsWith(prefix)) return;

	//Only commands after this point
	//Check if message is a command

	let args = message.content.split(" ").splice(1);

	const commandName = message.content.split(" ")[0].toLowerCase().split(prefix)[1];
	const command = client.commands.get(commandName) || client.commands.find(c=>c.controls.aliases && c.controls.aliases.includes(commandName));

	if(!command) return;

	if (permission > command.controls.permission) {
		core.commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but did not have permission to do so.`, {embeds:[{description: message.content}]});
		return message.react("🚫");
		//message.channel.send(":rotating_light: The bot is currently experiencing issues, and command usage has been locked.");
	}
	if (command.controls.enabled === false) {
		core.commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but the command is disabled.`, {embeds:[{description: message.content}]});
		return message.channel.send((new Discord.RichEmbed().setTitle("Notice").setDescription(`As of June 23rd, 2020 FollowBot is being discontinued, therefore this command is disabled. See the [support server](https://discord.gg/${support_invite}) for more information.`).setColor("RED")));
	}
	core.commandLog(`:wrench: ${message.author.tag} (\`${message.author.id}\`) ran command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`)`, {embeds:[{description: message.content}]});

	if (command.controls.permissions) {
		const channelPermissions = message.channel.memberPermissions(client.user.id);

		const list = channelPermissions.missing(command.controls.permissions).map(p=>permissionNames[p]);

		if (list.length >= 1) {
			if (channelPermissions.has("EMBED_LINKS")) {
				//Can embed
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${message.channel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${list.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor("RED");
				return message.channel.send(embed).catch(err => {
					//message.author.send(`Your command \`${commandText}\` used in <#${message.channel.id}> failed to execute because <@${client.user.id}> does not have the **Send Messages** permission in that channel. Please make sure <@${client.user.id}> can send messages and try again.`);
				});
			} else {
				//Cannot embed
				return message.channel.send(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${message.channel.id}> channel:\n - ${list.join("\n- ")}\nIn the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has the following permissions allowed.`).catch(err => {
					//message.author.send(`Your command \`${commandText}\` used in <#${message.channel.id}> failed to execute because <@${client.user.id}> does not have the **Send Messages** permission in that channel. Please make sure <@${client.user.id}> can send messages and try again.`);
				});
			}
		}
	}

	try {
		await command.do(message, client, args, Discord, permission);
	} catch (err) {
		message.channel.send(`<:${emoji.x}> Something went wrong with that command, please try again later.`);
		console.log(err);
		core.errorLog(err, "Command Handler", `Message Content: ${message.content}`);
	}

};
