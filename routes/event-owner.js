const express = require('express');
const router = express.Router();
const Event = require('../models/kts-admin/event')
const Package = require('../models/kts-admin/package')
const Excursion = require('../models/kts-admin/excursion')
const { isLoggedIn, isEventOwner } = require('../middleware/loggedIn')
require('dotenv').config()


const paypal = require('paypal-rest-sdk')
paypal.configure({
	'mode': 'live', //sandbox or live
	'client_id': 'AT_-WItSvpf-wCa-8vSkYucgxl5Ckj5qSm013duHJpA78oYxTUkRhqlSlZrd4eNz4iNhhhZKVL9wWYl5',
	'client_secret': 'ECJC_ShlWhkmO_ZfRPTbGCbVqA-SKkLXXw9MEGhH6jCYHLmEzG_eQUUb8dVV8x562Dgn8eAcf4KGNG2n'
});

router.route('/home/:eventid')
	.get(isLoggedIn, isEventOwner, async (req, res) => {
		const { eventid } = req.params
		const currentEvent = await Event.findById(eventid).populate('packages')
		res.render('event-owner/home', { layout: "./layouts/Admin/event", title: "event owner", eventid, currentEvent })
	})

router.route('/:eventid/:packageId/:optionNum')
	.get(isLoggedIn, isEventOwner, async (req, res) => {
		const { eventid, packageId, optionNum } = req.params
		const currentPackage = await Package.findById(packageId)
		const currentPackageOption = currentPackage.packageOption[optionNum - 1]
		let availableQuantity = currentPackageOption.availableQuantity
		res.render('event-owner/payment-info', { layout: "./layouts/event-owner/pay", title: "Payment Info", eventid, currentPackage, optionNum, availableQuantity })
	})
	.post(isLoggedIn, isEventOwner, async (req, res) => {
		const { eventid, packageId, optionNum } = req.params
		const currentEvent = await Event.findById(eventid)
		const currentPackage = await Package.findById(packageId)
		const currentPackageOption = currentPackage.packageOption[optionNum - 1]
		const optionPrice = currentPackageOption.price

		const create_payment_json = {
			"intent": "sale",
			"payer": {
				"payment_method": "paypal"
			},
			"redirect_urls": {
				"return_url": `/event-owner/${eventid}/${packageId}/${optionNum}/success`,
				"cancel_url": "http://localhost:3000/event-owner/cancel"
			},
			"transactions": [{
				"item_list": {
					"items": [{
						"name": currentEvent.title,
						"sku": "001",
						"price": optionPrice,
						"currency": "EUR",
						"quantity": 1
					}]
				},
				"amount": {
					"currency": "EUR",
					"total": optionPrice
				},
				"description": currentPackageOption.optionDescription
			}]
		};

		paypal.payment.create(create_payment_json, async function (error, payment) {
			if (error) {
				throw error;
			} else {
				for (let i = 0; i < payment.links.length; i++) {
					if (payment.links[i].rel === 'approval_url') {
						res.redirect(payment.links[i].href);
						console.log(payment)
						//it will create and save the excursion data
						const newExcursion = new Excursion({ paymentID: payment.id, ...req.body })
						await newExcursion.save().then(res => console.log(res))
					}
				}
			}
		});
	})

router.get('/:eventid/:packageId/:optionNum/success', async (req, res) => {
	const { eventid, packageId, optionNum } = req.params
	const currentEvent = await Event.findById(eventid)
	const currentPackage = await Package.findById(packageId)
	const currentPackageOption = currentPackage.packageOption[optionNum - 1]
	const optionPrice = currentPackageOption.price
	const payerId = req.query.PayerID;
	const paymentId = req.query.paymentId;

	const execute_payment_json = {
		"payer_id": payerId,
		"transactions": [{
			"amount": {
				"currency": "EUR",
				"total": optionPrice
			}
		}]
	};
	// Obtains the transaction details from paypal
	paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
		//When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.
		if (error) {
			console.log(error.response);
			throw error;
		} else {
			console.log(JSON.stringify(payment));
			res.send('Success');
		}
	});
});

// router.get('/cancel', (req, res) => res.send('Cancelled'));



module.exports = router;
