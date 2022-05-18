require('dotenv').config()
const nodemailer = require('nodemailer')
const { generateRandomPass } = require('./reusable')
const User = require('../models/kts-admin/user')
const fs = require('fs')
const csv = require('csv-parser')

module.exports.eventOwnerEmail = async (req, res, username, eventId) => {
	let grantedPassword = generateRandomPass
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL,
			pass: process.env.PASSWORD
		}
	});


	let mailOptions = {
		from: process.env.EMAIL,
		to: username.toString(),
		subject: 'Event Owner Password Grant',
		text: 'Dear Client ' + username.toString() + ', your granted password is: ' + grantedPassword
	};
	try {
		const isAdmin = 1
		const newUser = new User({ username, isAdmin, eventId })
		const registeredUser = await User.register(newUser, grantedPassword)
		if (registeredUser) {
			req.flash('success', 'You have successfully registered the event owner')
			transporter.sendMail(mailOptions, (err, res) => {
				if (err) {
					console.log(err)
				}
				else {
					console.log('success')
				}
			})
		}
	} catch (error) {
		req.flash('error', error.message)
		res.redirect('/kts-admin/new-event');

	}

}

module.exports.invitedIndividualEmail = async (req, res, eventId) => {
	let emails = []
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL,
			pass: process.env.PASSWORD
		}
	});

	fs.createReadStream('../routes/myFile.csv')
		.pipe(csv()).on('data', (row) => emails.push(row.Emails))
		.on('error', (err) => console.log("ERROR"))
		.on('end', async () => {
			for (let i = 0; i < emails.length; i++) {
				try {
					let grantedPassword = generateRandomPass
					let mailOptions = {
						from: process.env.EMAIL,
						to: username.toString(),
						subject: 'Event Owner Password Grant',
						text: 'Dear Client ' + username.toString() + ', your granted password is: ' + grantedPassword
					};
					let username = emails[i]
					const isAdmin = 0
					let newUser = new User({ username, isAdmin, eventId })
					let registeredUser = await User.register(newUser, grantedPassword)
					if (registeredUser) {
						req.flash('success', 'You have successfully registered the invited individual')
						transporter.sendMail(mailOptions, (err, res) => {
							if (err) {
								console.log(err)
							}
							else {
								console.log('success')
							}
						})
					}
				} catch (error) {
					req.flash('error', error.message)
					res.redirect('/event-owner/home');

				}
			}
		})

}

module.exports.newsLetterSubscribe = (req, res) => {
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL,
			pass: process.env.PASSWORD
		}
	});
	var mailOptions = {
		from: 'KTS event website',
		to: process.env.EMAIL,
		subject: 'Newsletter Subscription Request',
		text: 'Hello KTS Team,\n\nKindly note that: ' + req.body.email + ' has requested to subscribe to our Events newsLetter. \n \n' + 'Thank you & Best Regards'
	};
	transporter.sendMail(mailOptions, (err, res) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log('KTS success')
		}
	});

	var mailOptions = {
		from: 'KTS event website',
		to: req.body.email,
		subject: 'Newsletter Subscription Confirmation',
		text: 'Hello from KTS Team,\n\nKindly note that your newsLetter subscription request is being handled by our team. \n \n' + 'Thank you & Best Regards'
	};
	transporter.sendMail(mailOptions, (err, res) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log('customer success')
		}
	});

	res.redirect('/')
}

