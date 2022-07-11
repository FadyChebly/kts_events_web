const express = require('express');
const router = express.Router();
const Event = require('../models/kts-admin/event')
const Package = require('../models/kts-admin/package')
const Excursion = require('../models/kts-admin/excursion')
const { voucherMail, excursionMail } = require('../middleware/emailHandler')
const { isLoggedIn, isEventOwner } = require('../middleware/loggedIn')
require('dotenv').config()

let ayreBelNabe = []
let customer = {}
CurrentEventID = 0

const paypal = require('@paypal/checkout-server-sdk')
const Environment =
	process.env.NODE_ENV = paypal.core.LiveEnvironment
const paypalClient = new paypal.core.PayPalHttpClient(
	new Environment(
		process.env.PAYPAL_CLIENT_ID,
		process.env.PAYPAL_CLIENT_SECRET
	)
)

router.route('/home/:eventid')
	.get(isLoggedIn, isEventOwner, async (req, res) => {
		const { eventid } = req.params
		const currentEvent = await Event.findById(eventid).populate('packages')
		res.render('event-owner/home', { layout: "./layouts/Admin/event", title: "event owner", eventid, currentEvent })
	})

router.route('/:eventid/:packageId/:optionNum')
	.get(isLoggedIn, isEventOwner, async (req, res) => {
		customer = []
		const { eventid, packageId, optionNum } = req.params
		const currentPackage = await Package.findById(packageId)
		const currentPackageOption = currentPackage.packageOption[optionNum - 1]
		let availableQuantity = currentPackageOption.availableQuantity
		res.render('event-owner/payment-info', { layout: "./layouts/event-owner/pay", title: "Payment Info", eventid, currentPackage, optionNum, availableQuantity })
	})
	.post(isLoggedIn, isEventOwner, async (req, res) => {
		const { eventid, packageId, optionNum } = req.params
		const newExcursion = new Excursion({ packageID: packageId, ...req.body })
		await newExcursion.save().then((result) => {
			CurrentEventID = eventid
			customer = newExcursion
			console.log(`Hayda ek customer ${customer}`)
			console.log(`hayda el event id ${CurrentEventID}`)
			console.log(result)
			res.redirect(`/event-owner/${eventid}/${packageId}/${optionNum}/pay`)
		})
	})

router.route('/:eventid/:packageId/:optionNum/pay')
	.get(isLoggedIn, isEventOwner, async (req, res) => {
		ayreBelNabe = []
		const { eventid, packageId, optionNum } = req.params
		ayreBelNabe = [eventid, packageId, optionNum]
		console.log(`ayre b rab alla ${ayreBelNabe}`)
		const clientID = 'AT_-WItSvpf-wCa-8vSkYucgxl5Ckj5qSm013duHJpA78oYxTUkRhqlSlZrd4eNz4iNhhhZKVL9wWYl5'
		res.render('event-owner/payment', { layout: "./layouts/event-owner/ensa", title: "Payment Info", eventid, packageId, optionNum, clientID })

	})
router.route('/pay')
	.post(isLoggedIn, isEventOwner, async (req, res) => {
		const optionNum = ayreBelNabe[2]
		const currentPackage = await Package.findById(ayreBelNabe[1])
		const currentPackageOption = currentPackage.packageOption[optionNum - 1]
		const request = new paypal.orders.OrdersCreateRequest()
		const total = currentPackageOption.price
		request.prefer("return=representation")
		request.requestBody({
			intent: "CAPTURE",
			purchase_units: [
				{
					amount: {
						currency_code: "EUR",
						value: total,
						breakdown: {
							item_total: {
								currency_code: "EUR",
								value: total,
							},
						},
					},
					items: req.body.items.map(item => {
						console.log(item)
						return {
							name: currentPackage.title,
							unit_amount: {
								currency_code: "EUR",
								value: currentPackageOption.price,
							},
							// description: currentPackageOption.optionDescription,
							quantity: 1,
						}
					}),
				},
			],
		})

		try {
			const order = await paypalClient.execute(request)
			res.json({ id: order.result.id })
			console.log('payment success')
			const currentEvent = await Event.findById(CurrentEventID)
			const currentExcursion = await Excursion.findByIdAndUpdate(customer._id, { success: true })
			console.log(`updated excursion ${currentExcursion}`)
			await voucherMail(req, res, currentEvent, currentPackage, currentPackageOption, currentExcursion)
			await excursionMail(req, res, currentEvent, currentPackage, currentPackageOption, currentExcursion)
			req.flash('success', 'Successful Payment')
		} catch (e) {
			res.status(500).json({ error: e.message })
		}
		res.redirect(`/event-owner/home/${CurrentEventID}`)

	})


module.exports = router;
