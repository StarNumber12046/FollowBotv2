const { main_guild } = require("../config.json");
module.exports = {
	controls: {
		permission: 10,
		usage: "updates",
		aliases: ["joinupdates"],
		description: "Adds/Removes the Updates role from you",
		enabled: false,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: (message, client, args, Discord) => {
		if (message.guild.id !== main_guild) return;
		if (!message.member.roles.has("670752517373820941")) {
			message.member.addRole("670752517373820941");
			message.channel.send("You have been given the Updates role.");
		} else if (message.member.roles.has("670752517373820941")) {
			message.member.removeRole("670752517373820941");
			message.channel.send("You have been removed from the Updates role.");
		}
	}
};
