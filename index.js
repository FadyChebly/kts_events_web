const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require("method-override");
const expressLayouts = require('express-ejs-layouts')
const Package = require('./models/kts-admin/package')
const Event = require('./models/kts-admin/event')
const User = require('./models/kts-admin/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const verify = require('./middleware/verifyToken')
const cookieParser = require('cookie-parser')
const nodemailer = require('nodemailer')
const fs = require('fs')
const csv = require('csv-parser')
require('dotenv').config()

// database connection conf
mongoose.connect(process.env.CONNECTION_STRING, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
	console.log("Database Connected");
});
//end of database connection conf

const Joi = require('@hapi/joi');
const schema = Joi.object({
	email: Joi.string().min(6).required().email(),
	password: Joi.string().min(6).required()
});

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.set('layout', './layouts/landing-pages-layout')

app.use(expressLayouts)
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(cookieParser())


//landing pages routing
app.get('/', (req, res) => {
	res.render('Landing-Pages/home', { title: "KTS" })
})

app.get('/about', (req, res) => {
	res.render('Landing-Pages/about', { title: "About" })
})

app.get('/contact', (req, res) => {
	res.render('Landing-Pages/contact', { title: "Contact Us" })
})

app.get('/register', (req, res) => {
	res.render('Landing-Pages/register', { layout: "./layouts/register-layout", title: "Register" })
})

app.get('/login', (req, res) => {
	res.render('Landing-Pages/login', { layout: "./layouts/login-layout", title: "Login" })
})
app.get('/password-grant', (req, res) => {
	res.render('Landing-Pages/password-grant', { layout: "./layouts/password-grant", title: "Password Grant" })
})
app.get('/welcome', (req, res) => {
	if (req.cookies.token)
		res.render('Landing-Pages/welcome', { layout: "./layouts/welcome-layout", title: "Welcome!!" })
	else {
		res.redirect('login')
	}
})
//end of landing pages routing


//start of admin routes
app.get('/kts-admin/home', async (req, res) => {
	const events = await Event.find({})
	res.render('Kts-Admin/home', { events, layout: "./layouts/admin-layout", title: "Admin - Home" })
})

//start of add event
//start of event owner add page
app.get('/kts-admin/new-event', (req, res) => {
	res.render('Kts-Admin/event-owner', { layout: "./layouts/admin-layout", title: "Admin - New Event" })
})

//post the owner for a new event and go to fill the event with the needed data
app.post('/kts-admin/event', async (req, res) => {
	const { email } = req.body
	const newEvent = new Event({ owner: `${email}` })
	await newEvent.save().then(res => { console.log(`success to post event owner`) }).catch(err => { console.log(err) })
	const id = newEvent._id.toString()
	res.redirect(`/kts-admin/event/${id}`)
})
//end of add event owner logic to an event

//start of add needed data and package for a specific event
app.get('/kts-admin/event/:id', async (req, res) => {
	const { id } = req.params
	let event = await Event.findById(id).then(res => { console.log(`success to reach the new event with id: ${id} ${res}`) }).catch(err => { console.log(err) })
	while (event == undefined) {
		event = await Event.findById(id)
		console.log('in the loop')
	}
	res.render('Kts-Admin/event', { layout: "./layouts/admin-layout", title: "Event", event })
})

//returns with the package added concerning the specific event
app.post('/kts-admin/event/:id', async (req, res) => {
	const { id } = req.params
	const newPackage = req.body
	let addedPackage = new Package({ title: newPackage.title, description: newPackage.description, price: newPackage.price })
	await addedPackage.save().then(res => { console.log(`added package is ${res}`) })
	let Relatedevent = await Event.findById(id).then(res => {
		console.log(`will add now a new package for ${res}`)
	})
		.catch(err => { console.log(err) })
	while (Relatedevent == undefined) {
		Relatedevent = await Event.findById(id)
	}
	let relatedPackage = await Package.findById(addedPackage._id)
	while (relatedPackage == undefined) {
		relatedPackage = await Package.findById(addedPackage._id)
	}
	Relatedevent.packages.push(relatedPackage)
	await Relatedevent.save().then(res => { console.log(`the event is now as follows ${res}`) })
	let event = await Event.findById(id).populate('packages').then(res => {
		console.log(event)
	}).catch(err => console.log(`try again`))
	// while (event == undefined) {
	// 	event = await Event.findById(id).populate('packages').then(res => {
	// 		console.log(event)
	// 	}).catch(err => console.log(`try again`))
	// }
	res.render('Kts-Admin/event', { layout: "./layouts/test", title: "Event", event })
})

// start of add package go to add a package related to the event
app.get('/kts-admin/event/:id/package', async (req, res) => {
	const { id } = req.params
	console.log(id)
	let relatedEvent = await Event.findById(id).then(res => {
		console.log(`the package is linked to the following event ${res}`)
	})
	while (relatedEvent == undefined) {
		relatedEvent = await Event.findById(id)
	}
	res.render('Kts-Admin/package', { layout: "./layouts/test", title: "package", relatedEvent })
})
//end of add package



app.post('/api/user/register', async (req, res) => {
	const { error } = schema.validate(req.body);
	//const {error} = regsiterValidation(req.body);
	if (error) {
		return res.status(400).send(error.details[0].message)
	}
	//Checking if the user is already in the db
	const emailExist = await User.findOne({ email: req.body.email })
	if (emailExist) {
		return res.status(400).send('email already exists')
	}
	//HASH the password
	const salt = await bcrypt.genSalt(10)
	const hashPassword = await bcrypt.hash(req.body.password, salt)
	//Create a new User
	const user = new User({
		name: req.body.name,
		email: req.body.email,
		password: hashPassword,
		isAdmin: 0
	})
	try {
		const savedUser = await user.save()
		res.send({ user: user._id })
	} catch (err) {
		res.status(400).send(err)
	}
})

app.post('/login', async (req, res) => {
	res.clearCookie("token");
	const { error } = schema.validate(req.body)
	if (error) {
		return res.status(400).send(error.details[0].message)
	}
	const { email, password } = req.body
	const user = await User.findOne({ email })
	if (!user) {
		return res.status(400).send('failed login: invalid credentials')
	}
	const validPass = await bcrypt.compare(password, user.password)
	if (!validPass) {
		return res.status(400).send('failed login: invalid credentials')
	}
	const token = jwt.sign({ user }, process.env.TOKEN_SECRET_KEY, { expiresIn: '24h' })
	res.cookie('token', token.toString())
	res.redirect('/welcome')
})
app.post('/password-grant', async (req, res) => {
	let emails = []
	let chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%&*ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const passwordLength = 12;
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL,
			pass: process.env.PASSWORD
		}
	});
	fs.createReadStream('sample_data.csv')
		.pipe(csv())
		.on('data', (row) => emails.push(row.Emails))
		.on('end', () => {
			for (let i = 0; i < emails.length; i++) {
				password = "";
				for (let j = 0; j <= passwordLength; j++) {
					randomNumber = Math.floor(Math.random() * chars.length);
					password += chars.substring(randomNumber, randomNumber + 1);
				}
				var mailOptions = {
					from: process.env.EMAIL,
					to: emails[i].toString(),
					subject: 'Password Granted',
					text: 'Dear Client, your granted password is: ' + password
				};
				//Checking if the user is already in the db
				const emailExist = User.findOne({ email: emails[i].toString() })
				if (emailExist) {
					console.log('email already exists')
				}
				//Create a new User
				else{
					transporter.sendMail(mailOptions, (err) => {
						if (err) {
							console.log(err);
						}
						else {
							console.log('success')
						}
					});
					const user = new User({
					name: 'test',
					email: emails[i],
					password: password,
					isAdmin: 0
				})
				try {
					user.save()
				} catch (err) {
					console.log(err)
				}
			}
		}
	})
})
app.post('/logout', (req, res) => {
	res.clearCookie("token");
	res.redirect('/login')
})

app.get('/welcome', verify, (req, res) => {
	if (!req.cookies.token) {
		return res.redirect('login')
	}
	else {
		return res.redirect('welcome')
	}
})

app.post('/contact', (req, res) => {
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL,
			pass: process.env.PASSWORD
		}
	});
	var mailOptions = {
		from: req.body.name + '&lt;' + process.env.EMAIL + '&gt;',
		to: 'codebookinc@gmail.com, fady.chebly1@gmail.com',
		subject: 'Message from the Contact Us',
		text: req.body.feedback
	};
	transporter.sendMail(mailOptions, (err, res) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log('success')
		}
	});
	res.redirect('contact')
})

app.post('/subscribe', (req, res) => {
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL,
			pass: process.env.PASSWORD
		}
	});
	var mailOptions = {
		from: process.env.EMAIL,
		to: 'codebookinc@gmail.com, fady.chebly1@gmail.com',
		subject: 'Email Newsletter Subscription Request',
		text: 'Dear KTS Administration Team,\n\n\nKindly approve & accept the request for the subscription of this email,\n' + req.body.email + '\nin order to complete the subscription to your Email Newsletter. \n \n \n \n' + 'Thank you & Best Regards'
	};
	transporter.sendMail(mailOptions, (err, res) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log('success')
		}
	});
	res.redirect('/')
})

app.listen(port, () => {
	console.log(`Listening on port ${port}`)
})
