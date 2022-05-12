const mongoose = require('mongoose')
// require('dotenv').config()

module.exports = function connection() {
	mongoose.connect(process.env.CONNECTION_STRING, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	const db = mongoose.connection;
	db.on("error", console.error.bind(console, "connection error"));
	db.once("open", () => {
		console.log("Database Connected");
	});
}
