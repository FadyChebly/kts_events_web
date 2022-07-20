const express = require('express');
const router = express.Router();
const Event = require('../models/kts-admin/event')
const Package = require('../models/kts-admin/package')
const Excursion = require('../models/kts-admin/excursion')
const { voucherMail, excursionMail } = require('../middleware/emailHandler')
const { isLoggedIn, isEventOwner } = require('../middleware/loggedIn')
require('dotenv').config()

let paymentDetailsArr = []
let customer = {}
currentEventID = 0

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
		const { q } = req.query
		const { eventid } = req.params
		const currentEvent = await Event.findById(eventid).populate('packages')
		if (q) {
			console.log('serna bel flash')
			req.flash('success', 'Successful Payment')
		}
		res.render('event-owner/home', { layout: "./layouts/Admin/event", title: "event owner", eventid, currentEvent, q })
		console.log(`q:${q}`)

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
			currentEventID = eventid
			customer = newExcursion
			res.redirect(`/event-owner/${eventid}/${packageId}/${optionNum}/pay`)
		})
	})

router.route('/:eventid/:packageId/:optionNum/pay')
	.get(isLoggedIn, isEventOwner, async (req, res) => {
		paymentDetailsArr = []
		const { eventid, packageId, optionNum } = req.params
		paymentDetailsArr = [eventid, packageId, optionNum]
		const clientID = 'AT_-WItSvpf-wCa-8vSkYucgxl5Ckj5qSm013duHJpA78oYxTUkRhqlSlZrd4eNz4iNhhhZKVL9wWYl5'
		res.render('event-owner/payment', { layout: "./layouts/event-owner/ensa", title: "Payment Info", eventid, packageId, optionNum, clientID })

	})

router.route('/pay')
	.post(isLoggedIn, isEventOwner, async (req, res) => {
		const optionNum = paymentDetailsArr[2]
		const currentPackage = await Package.findById(paymentDetailsArr[1])
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
							quantity: 1,
						}
					}),
				},
			],
		})

		try {
			const order = await paypalClient.execute(request)
			res.json({ id: order.result.id })
		} catch (e) {
			res.status(500).json({ error: e.message })
		}

	})

router.route('/send-emails')
	.post(async (req, res) => {
		const optionNum = paymentDetailsArr[2]
		const currentPackage = await Package.findById(paymentDetailsArr[1])
		let packageOptions = currentPackage.packageOption
		const currentPackageOption = currentPackage.packageOption[optionNum - 1]
		const currentPackageQty = currentPackage.packageOption[optionNum - 1].availableQuantity
		packageOptions[optionNum - 1].availableQuantity = currentPackageQty - 1
		console.log(`el options saro hek ${packageOptions}`)
		const currentEvent = await Event.findById(currentEventID)
		const currentExcursion = await Excursion.findByIdAndUpdate(customer._id, { success: true })
		console.log(`updated excursion ${currentExcursion}`)
		await voucherMail(req, res, currentEvent, currentPackage, currentPackageOption, currentExcursion)
		await excursionMail(req, res, currentEventID, currentEvent, currentPackage, currentPackageOption, currentExcursion)
		await Package.findByIdAndUpdate(paymentDetailsArr[1], { packageOption: packageOptions })
		// res.send({ redirect: `/event-owner/home/${currentEventID}` })
		res.sendStatus(200)
	})


module.exports = router;
