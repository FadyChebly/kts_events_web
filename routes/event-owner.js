const express = require('express');
const router = express.Router();
// const User = require('../models/kts-admin/user');
const Event = require('../models/kts-admin/event')
const Package = require('../models/kts-admin/package')
const { isLoggedIn, isEventOwner } = require('../middleware/loggedIn')
// const multer = require('multer')
// const fs = require('fs')
// const csv = require('csv-parser')
// const { generateRandomPass } = require('../middleware/reusable')
require('dotenv').config()
// const nodemailer = require('nodemailer')

//multer conf
// const multerStorage = multer.diskStorage({
// 	destination: (req, file, cb) => {
// 		cb(null, "public");
// 	},
// 	filename: (req, file, cb) => {
// 		const ext = file.mimetype.split("/")[1];
// 		cb(null, `${file.fieldname}.${ext}`);
// 	},
// });

// const multerFilter = (req, file, cb) => {
// 	if (file.mimetype.split("/")[1] === "csv") {
// 		cb(null, true);
// 	}
// 	else {
// 		cb(new Error("Not a csv File!!"), false);
// 	}
// };

// const upload = multer({
// 	storage: multerStorage,
// 	fileFilter: multerFilter,
// });

// .post(isLoggedIn, isEventOwner, upload.single('myFile'), async (req, res) => {
// 	const { eventid } = req.params
// 	const directory = __dirname.slice(0, __dirname.length - 6) + 'public/myFile.csv'
// 	try {
// 		var resolvedFlag = false
// 		let mypromise = () => {
// 			return new Promise((resolve, reject) => {
// 				let emails = []
// 				let users = []
// 				fs.createReadStream(directory)
// 					.pipe(csv()).on('data', (row) => emails.push(row.Emails))
// 					.on('error', (err) => console.log("ERROR"))
// 					.on('end', async () => {
// 						for (let i = 0; i < emails.length; i++) {
// 							const username = emails[i]
// 							const isAdmin = 0
// 							const foundUser = await User.findOne({ username: username })
// 							if (!foundUser) {
// 								let grantedPassword = generateRandomPass
// 								let newUser = new User({ username, isAdmin, eventId: eventid })
// 								const registeredUser = await User.register(newUser, grantedPassword)
// 								if (registeredUser) {
// 									resolvedFlag = true
// 									const user = {
// 										username: username,
// 										password: grantedPassword
// 									}
// 									users.push(user)
// 								}
// 								else {
// 									resolvedFlag = false
// 								}
// 							}
// 						}
// 						if (resolvedFlag)
// 							resolve(users)
// 						else
// 							reject(null)
// 					})
// 			});
// 		};

// 		mypromise().then((res) => {
// 			let transporter = nodemailer.createTransport({
// 				service: 'gmail',
// 				auth: {
// 					user: process.env.EMAIL,
// 					pass: process.env.PASSWORD
// 				}
// 			});
// 			for (let i = 0; i < res.length; i++) {
// 				let mailOptions = {
// 					from: process.env.EMAIL,
// 					to: res[i].username,
// 					subject: 'Invited individual-Password Grant',
// 					text: 'Dear Client ' + res[i].username + ', WELCOME! You can login now with your email and password: ' + res[i].password
// 				};
// 				transporter.sendMail(mailOptions, (err, res) => {
// 					if (err) {
// 						console.log(err)
// 					}
// 					else {
// 						console.log('success')
// 					}
// 				})
// 			}
// 			fs.unlinkSync(directory)
// 			res.redirect(`/event-owner/home/${eventid}`)
// 		}).catch((error) => {
// 			console.log(`Handling error as we received ${error}`);
// 		});
// 	} catch (e) {
// 		req.flash('error', e.message)
// 	}

// })
const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripe = require('stripe')(stripePrivateKey)

router.route('/home/:eventid')
	.get(isLoggedIn, isEventOwner, async (req, res) => {
		const { eventid } = req.params
		const currentEvent = await Event.findById(eventid).populate('packages')
		res.render('event-owner/home', { layout: "./layouts/Admin/event", title: "event owner", eventid, currentEvent, key: stripePublicKey })
	})

router.route('/:eventid/:packageId/:optionNum')
	.post(isLoggedIn, isEventOwner, async (req, res) => {
		const { eventid, packageId, optionNum } = req.params
		const currentPackage = await Package.findById(packageId)
		const currentPackageOption = currentPackage.packageOption[optionNum - 1]
		const optionPrice = currentPackageOption.price * 100

		stripe.customers.create({
			email: req.body.stripeEmail,
			source: req.body.stripeToken,
			name: 'Package Pricing',
			// address: {
			// 	line1: 'TC 9/4 Old MES colony',
			// 	postal_code: '110092',
			// 	city: 'New Delhi',
			// 	state: 'Delhi',
			// 	country: 'India',
			// }
		}).then((customer) => {
			return stripe.charges.create({
				amount: optionPrice,	 // Charing Rs 25 
				description: `Dear Client\n\nYou have successfully paid and reserved the package:\n${currentPackage.title}\nYou have chosen the following option:\n${currentPackageOption.optionDescription}\n\n If any issues occures do not hesitate, and contact us!\n\n KTS support team.`,
				currency: 'eur',
				customer: customer.id,
				receipt_email: req.body.stripeEmail
			});
		}).then((charge) => {
			console.log('fady wsolna 3al charge')
			console.log(charge)
			req.flash("success", "Payment sent Successfully");
			res.redirect(`/event-owner/home/${eventid}`); // If no error occurs 
		}).then(async (receipt) => {
			await stripe.paymentIntents.create({
				amount: optionPrice,
				currency: 'eur',
				payment_method_types: ['card'],
				receipt_email: req.body.stripeEmail,
				description: `Dear Client\n\nYou have successfully paid and reserved the package:\n${currentPackage.title}\nYou have chosen the following option:\n${currentPackageOption.optionDescription}\n\n If any issues occures do not hesitate, and contact us!\n\n KTS support team.`,
			});
		})
			.catch((err) => {
				req.flash("error", "Payment error");
				res.redirect(`/event-owner/home/${eventid}`); // If no error occurs 
			});

	})



module.exports = router;
