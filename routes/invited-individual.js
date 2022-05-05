const express = require('express');
const router = express.Router();
const User = require('../models/kts-admin/user');
const Event = require('../models/kts-admin/event')
const { isLoggedIn, isInvited } = require('../middleware/loggedIn')

router.route('/home/:eventid')
	.get(isLoggedIn, isInvited, async (req, res) => {
		const { eventid } = req.params
		const currentEvent = await Event.findById(eventid).populate('packages')
		res.render('invited-individual/home', { layout: "./layouts/Admin/event", title: "invited Individual", eventid, currentEvent })
	})

module.exports = router;
