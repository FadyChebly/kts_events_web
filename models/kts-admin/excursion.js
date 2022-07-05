const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ExcursionSchema = new Schema({

	paymentID: {
		type: String,
	},
	fName: {
		type: String,
	},
	lName: {
		type: String,
	},
	email: {
		type: String,
	},
	phone: {
		type: String,
	},
	whatsapp: {
		type: String,
	},
	dob: {
		type: String,
	}

})

module.exports = mongoose.model('Excursion', ExcursionSchema)