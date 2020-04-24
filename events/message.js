//this is a change
const core = require("../coreFunctions.js");
const { dbQuery, dbModifyId, dbDeleteOne, dbModify } = require("../coreFunctions");
const { emoji } = require("../config.json");
const config = require("../config.json");
const permissionNames = require("../utils/permissions.json");

module.exports = async (Discord, client, message) => {
	if (message.channel.type !== "text") {
		if (message.channel.type === "dm" && client.user.id !== message.author.id) return core.coreLog(":e_mail: **" + message.author.tag + "** (" + message.author.id + ") sent a DM to the bot:\n" + message.content, client);
		return;
	}
	if (message.author.bot === true) return;

	let permission = await core.checkPermissions(message.member, client);

	let prefix;

	const prefixes = [config.prefix, `<@!${client.user.id}>`, `<@${client.user.id}>`];

	if(permission <= 1) prefixes.push("followbot:", client.user.id);

	for(let thisPrefix of prefixes) {
		if(message.content.startsWith(thisPrefix)) prefix = thisPrefix;
	}

	if (!prefix || !message.content.startsWith(prefix)) return;

	let args = message.content.slice(prefix.length).trim().split(/ +/g);

	if(args.length === 0) return;

	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName) || client.commands.find(c => c.controls.aliases && c.controls.aliases.includes(commandName));
	if (!command) return;

	if (permission > command.controls.permission) {
		core.commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but did not have permission to do so.`, {embeds:[{description: message.content}]});
		return message.react("🚫");
		//message.channel.send(":rotating_light: The bot is currently experiencing issues, and command usage has been locked.");
	}
	if (command.controls.enabled === false) {
		core.commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but the command is disabled.`, {embeds:[{description: message.content}]});
		return message.channel.send("This command is currently disabled globally.");
	}
	core.commandLog(`:wrench: ${message.author.tag} (\`${message.author.id}\`) ran command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`)`, {embeds:[{description: message.content}]});

	if (command.controls.permissions) {
		const channelPermissions = message.channel.permissionsFor(client.user.id);

		const list = channelPermissions.missing(command.controls.permissions).map(p=>permissionNames[p]);

		if (list.length >= 1) {
			if (channelPermissions.has("EMBED_LINKS")) {
				//Can embed
				let embed = new Discord.MessageEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${message.channel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${list.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor("RED");
				return message.channel.send(embed).catch(err => {
					message.author.send(`Your command \`${commandText}\` used in <#${message.channel.id}> failed to execute because <@${client.user.id}> does not have the **Send Messages** permission in that channel. Please make sure <@${client.user.id}> can send messages and try again.`);
				});
			} else {
				//Cannot embed
				return message.channel.send(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${message.channel.id}> channel:\n - ${list.join("\n- ")}\nIn the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has the following permissions allowed.`).catch(err => {
					message.author.send(`Your command \`${commandText}\` used in <#${message.channel.id}> failed to execute because <@${client.user.id}> does not have the **Send Messages** permission in that channel. Please make sure <@${client.user.id}> can send messages and try again.`);
				});
			}
		}
	}

	try {
		await command.do(message, client, args, Discord);
	} catch (err) {
		message.channel.send(`<:${emoji.x}> Something went wrong with that command, please try again later.`);
		console.log(err);
		core.errorLog(err, "Command Handler", `Message Content: ${message.content}`);
	}

};
