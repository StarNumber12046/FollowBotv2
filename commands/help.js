const { checkPermissions, permLevelToRole } = require("../coreFunctions");
const { prefix, main_guild } = require("../config.json");
const { emoji } = require("../config.json");

module.exports = {
	controls: {
		permission: 10,
		aliases: ["command", "howto"],
		usage: "help <command name>",
		description: "Shows command information",
		enabled: true,
		docs: "all/help",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (!args[0]) {
			let embed = new Discord.MessageEmbed()
				.setAuthor(`${client.user.username} Help`, client.user.displayAvatarURL())
				.addField("Announcement Commands", "`setup <follow code>` -  Sets up a channel to publish announcements.\n`code <new code>` - Sets a new follow code for an announcement channel</new>\n`publish <follow code> <message id>` - Publishes a specified message to all following channels\n`info` - Shows information about how to follow an announcement channel\n`disable` - Disables an announcement channel, removing it from existence\n`follow <follow code>` - Follows an announcement channel in the current channel\n`stats` - Shows statistics of an announcement channel")
				.addField("Other Commands", `\`help (command)\` - Shows this information\n\`ping\` - Checks bot response time\n\`invite\` - Shows the link to invite the bot\n\`support\` - Shows the link to the support server, where you can ask for help with the bot${message.guild.id === main_guild ? "\n`updates` - Adds/removes the Updates role from you": ""}`)
				.setDescription(`The prefix of the bot is \`${prefix}\`. Using a mention as prefix works too.`)
				.setColor("BLUE");
			return message.channel.send(embed);
		}

		let permission = await checkPermissions(message.member, client);

		let commandName = args[0].toLowerCase();

		const command = client.commands.get(commandName) || client.commands.find(c=>c.controls.aliases && c.controls.aliases.includes(commandName));

		if(!command)
			return message.channel.send(`<:${emoji.x}> Unknown command or alias`);

		if (permission > command.controls.permission) return;

		let commandInfo = command.controls;

		let aliases;
		!commandInfo.aliases ? aliases = false : aliases = true;

		let returnEmbed = new Discord.MessageEmbed()
			.setColor("BLUE")
			.setDescription(commandInfo.description)
			.addField("Permission Level", permLevelToRole(commandInfo.permission), true)
			.addField("Usage", `\`${prefix}${commandInfo.usage}\``, true)
			.setAuthor(`Command: ${commandName}`, client.user.displayAvatarURL());

		if (aliases) returnEmbed.addField("Aliases", commandInfo.aliases.join(", "));
		if (!commandInfo.enabled) returnEmbed.addField("Additional Information", "⚠️ This command is currently disabled");

		return message.channel.send(returnEmbed);
	}
};
