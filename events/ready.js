const {presence} = require("../persistent");
const {coreLog, dbQueryAll, dbQuery} = require("../coreFunctions.js");

module.exports = async (Discord, client) => {

	coreLog(`:ok: Logged in with ${client.guilds.cache.size} servers!`, client);
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(presence.activity || "", {type: presence.type || "PLAYING"});

};
