require("dotenv").config();

if (process.env.PROJECT_NAME && process.env.PORT) {
	const http = require("http");
	const express = require("express");
	const app = express();
	app.get("/", (request, response) => {
		response.sendStatus(200);
	});
	app.listen(process.env.PORT);
	setInterval(() => {
		http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
	}, 280000);
}

const Discord = require("discord.js");
const fs = require("fs");

const client = new Discord.Client({ disableEveryone: true });
const core = require("./coreFunctions.js");
const { connect, connection } = require("mongoose");
const autoIncrement = require("mongoose-sequence");

connect(process.env.MONGO, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})
	.catch((err) => {
		throw new Error(err);
	});

autoIncrement(connection);

connection.on("open", () => {
	console.log("Connected to MongoDB!");
});
connection.on("error", (err) => {
	console.error("Connection error: ", err);
});

fs.readdir("./events/", (err, files) => {
	files.forEach(file => {
		const eventHandler = require(`./events/${file}`);
		const eventName = file.split(".")[0];

		client.on(eventName, (...args) => {
			try {
				eventHandler(Discord, client, ...args);
			} catch (err) {
				core.errorLog(err, "Event Handler", `Event: ${eventName}`);
			}

		});
	});
});

client.login(process.env.TOKEN)
	.catch((err) => {
		throw new Error(err);
	});

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

commandFiles.forEach(file => {

	const filename = `${process.cwd()}/commands/${file}`;
	const command = require(filename);
	const commandName = file.split(".")[0];
	command.name = commandName;
	client.commands.set(commandName, command);
});


// core.errorLog(err, type, footer)
client.on("error", (err) => {
	core.errorLog(err, "error", "something happened and idk what");
});
client.on("warn", (warning) => {
	console.warn(warning);
});
process.on("unhandledRejection", (err) => { // this catches unhandledPromiserejectionWarning and other unhandled rejections
	core.errorLog(err, "unhandledRejection", "oof something is broken x.x");
});
