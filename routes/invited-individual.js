const express = require('express');
const router = express.Router();
const User = require('../models/kts-admin/user');
const Event = require('../models/kts-admin/event')
const PUBLISHABLE_KEY = 'pk_test_51KwQfuA9bttju1E6K2olr2gW8vZFAxsXw8AxT4sTOkEKLUwGmNgWV6paeXpOUbxpOwU3ewfkG3AfdcK7rbcxWdnI00gydflff3'
const SECRET_KEY = 'sk_test_51KwQfuA9bttju1E6n1HDMHC5V40tjRXqf34HzwordODnwmtQ2trkgaO2DsMMsmvlY6wyAtc61UCOLN7e4AYyt8c300LoGY5Jnu'
const stripe = require('stripe')(SECRET_KEY)
const { isLoggedIn, isInvited } = require('../middleware/loggedIn')

router.route('/home/:eventid')
	.get(isLoggedIn, isInvited, async (req, res) => {
		const { eventid } = req.params
		const currentEvent = await Event.findById(eventid).populate('packages')
		res.render('invited-individual/home', { layout: "./layouts/Admin/event", title: "invited Individual", eventid, currentEvent, key: PUBLISHABLE_KEY })
	})


router.post('/payment/:eventid/:price', isLoggedIn, isInvited, async (req, res) => {
	const { eventid } = req.params
	const { price } = req.params
	stripe.customers.create({
		email: req.body.stripeEmail,
		source: req.body.stripeToken,
		name: 'Package Pricing',
		address: {
			line1: 'TC 9/4 Old MES colony',
			postal_code: '110092',
			city: 'New Delhi',
			state: 'Delhi',
			country: 'India',
		}
	})
		.then((customer) => {

			return stripe.charges.create({
				amount: price + 000,	 // Charing Rs 25 
				description: 'Event Owner Package',
				currency: 'USD',
				customer: customer.id
			});
		})
		.then((charge) => {
			req.flash("success", "Payment sent Successfully");
			res.redirect(`/invited-individual/home/${eventid}`); // If no error occurs 
		})
		.catch((err) => {
			res.send("error", err)	 // If some error occurs 
		});
})

module.exports = router;
