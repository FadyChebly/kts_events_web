const express = require('express');
const router = express.Router();
const Event = require('../models/kts-admin/event')
const Package = require('../models/kts-admin/package')
const { isLoggedIn, isEventOwner } = require('../middleware/loggedIn')
require('dotenv').config()

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
