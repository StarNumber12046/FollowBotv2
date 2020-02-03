const { checkPermissions, permLevelToRole } = require("../coreFunctions");
const { readdir } = require("fs");
const { prefix } = require("../config.json");

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
			let embed = new Discord.RichEmbed()
				.setAuthor(`${client.user.username} Help`, client.user.displayAvatarURL)
				.addField("Announcement Commands", "`setup <follow code>` -  Sets up a channel to publish announcements.\n`code <new code>` - Sets a new follow code for an announcement channel</new>\n`publish <follow code> <message id>` - Publishes a specified message to all following channels\n`follow <follow code>` - Follows an announcement channel in the current channel\n`stats` - Shows statistics of an announcement channel")
				.addField("Other Commands", "`help (command)` - Shows this information\n`ping` - Checks bot response time\n`invite` - Shows the link to invite the bot\n`support` - Shows the link to the support server, where you can ask for help with the bot")
				.setDescription("The prefix of the bot is `-`.")
				.setColor("BLUE");
			return message.channel.send(embed);
		}

		let permission = await checkPermissions(message.member, client);

		let commandName = args[0].toLowerCase();
		readdir("./commands/", (err, files) => {
			files.forEach(file => {
				const commandNameFile = file.split(".")[0]; //Command to check against
				const command = require(`../commands/${commandNameFile}.js`); //Command file
				if (commandName === commandNameFile || (command.controls.aliases && command.controls.aliases.includes(commandName))) {

					if (permission > command.controls.permission) return;

					let commandInfo = command.controls;

					let aliases;
					!commandInfo.aliases ? aliases = false : aliases = true;

					let returnEmbed = new Discord.RichEmbed()
						.setColor("BLUE")
						.setDescription(commandInfo.description)
						.addField("Permission Level", permLevelToRole(commandInfo.permission), true)
						.addField("Usage", `\`${prefix}${commandInfo.usage}\``, true)
						.setAuthor(`Command: ${commandName}`, client.user.displayAvatarURL);

					if (aliases) returnEmbed.addField("Aliases", commandInfo.aliases.join(", "));
					if (!commandInfo.enabled) returnEmbed.addField("Additional Information", "⚠️ This command is currently disabled");

					return message.channel.send(returnEmbed);
				}
			});
		});

	}
};
