const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/kts-admin/user');
const { newsLetterSubscribe } = require('../middleware/emailHandler')


router.route('/')
	.get((req, res) => {
		res.render('Landing-Pages/home', { title: "KTS" })
	})
	.post((req, res) => {
		newsLetterSubscribe(req, res)
	})

router.get('/about', (req, res) => {
	res.render('Landing-Pages/about', { title: "About" })
})

router.get('/contact', (req, res) => {
	res.render('Landing-Pages/contact', { title: "Contact Us" })
})

router.post('/register', catchAsync(async (req, res, next) => {
	try {
		const { username, password, isAdmin } = req.body;
		const user = new User({ username, isAdmin });
		const registeredUser = await User.register(user, password);
		req.login(registeredUser, err => {
			if (err) return next(err);
			req.flash('success', 'Welcome!');
			res.redirect('/login');
			console.log(registeredUser)
		})
	} catch (e) {
		req.flash('error', e.message);
		res.redirect('/login');
	}
}));

router.route('/login')
	.get((req, res) => {
		res.render('Landing-Pages/login', { layout: "./layouts/login-layout", title: "Login" })
	})
	.post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
		req.flash('success', 'welcome back!');
		const { isAdmin } = req.user
		console.log(`${isAdmin}`)
		let redirectUrl = req.session.returnTo || '/login';
		if (isAdmin == 2) {
			redirectUrl = req.session.returnTo || '/kts-admin/home';
		}
		else if (isAdmin == 1) {
			redirectUrl = req.session.returnTo || `/event-owner/home/${req.user.eventId}`;
		}
		else if (isAdmin == 0) {
			redirectUrl = req.session.returnTo || `/invited-individual/home/${req.user.eventId}`;
		}
		else {
			redirectUrl = req.session.returnTo || '/login';
			req.flash('error', 'You have no access to the system!');
		}
		delete req.session.returnTo;
		res.redirect(redirectUrl);
	})

router.post('/logout', (req, res) => {
	req.logout();
	req.flash('success', "Goodbye!");
	res.redirect('/login');
})

module.exports = router;