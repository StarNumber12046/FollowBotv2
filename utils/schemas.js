const { Schema, model } = require("mongoose");
const { prefix } = require("../config.json");
// IMPORTANT: Snowflakes MUST be Strings, not Numbers

const subscriptions = new Schema({
	subscribedGuildId: { type: String, required: true }, // server id
	subscribedChannelId: { type: String, required: true }, // channel id
	followedGuildId: { type: String, required: true },
	followedChannelId: { type: String, required: true },
	webhook: {
		id: { type: String },
		token: { type: String }
	}
});

const settings = new Schema({
	guildId: { type: String, required: true },
	channelId: { type: String, required: true },
	followCode: { type: String, required: true },
	published: { type: Array }
});

const user = new Schema({
	id: { type: String, required: true }, // user id
	blocked: { type: Boolean, default: false }
});

const servers = new Schema({
	id: { type: String, required: true }, // server id
	blocked: { type: Boolean, default: false }
});

module.exports = {
	Server: model("servers", servers, "servers"),
	Subscription: model("subscriptions", subscriptions, "subscriptions"),
	Origins: model("origins", settings, "settings"),
	User: model("user", user, "users")
};
