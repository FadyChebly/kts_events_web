const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PackageSchema = new Schema({
	title: {
		type: String,
		// required: true
	},
	description: {
		type: String,
		// required: true
	},
	price: {
		type: Number,
		// required: true
	}
})

module.exports = mongoose.model('Package', PackageSchema)