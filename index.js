if (process.env.NODE_ENV !== "production") {
	require('dotenv').config()
}
//test
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const port = process.env.PORT;
const path = require('path')
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const ExpressError = require('./utils/ExpressError');
const User = require('./models/kts-admin/user')
const methodOverride = require("method-override");
const expressLayouts = require('express-ejs-layouts')
const nodemailer = require('nodemailer')
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const MongoDBStore = require("connect-mongo")(session);

//Routes
const adminRoute = require('./routes/kts-admin')
const userRoutes = require('./routes/users');
const eventOwner = require('./routes/event-owner')
const invitedIndividual = require('./routes/invited-individual')

//db connection
mongoose.connect(process.env.CONNECTION_STRING, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
	console.log("Database Connected");
});

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.set('layout', './layouts/landing-pages-layout')

app.use(expressLayouts)
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(mongoSanitize({
	replaceWith: '_'
}))

//reorganise !!session conf for passport

const store = new MongoDBStore({
	url: process.env.CONNECTION_STRING,
	secret: 'thisshouldbeabettersecret!',
	touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
	console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
	store,
	name: 'session',
	secret: 'thisshouldbeabettersecret!',
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
}

// const scriptSrcUrls = [
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://api.mapbox.com/",
//     "https://kit.fontawesome.com/",
//     "https://cdnjs.cloudflare.com/",
//     "https://cdn.jsdelivr.net",
// ];
// const styleSrcUrls = [
//     "https://kit-free.fontawesome.com/",
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.mapbox.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://fonts.googleapis.com/",
//     "https://use.fontawesome.com/",
// ];
// const connectSrcUrls = [
//     "https://api.mapbox.com/",
//     "https://a.tiles.mapbox.com/",
//     "https://b.tiles.mapbox.com/",
//     "https://events.mapbox.com/",
// ];
// const fontSrcUrls = [];
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: [],
//             connectSrc: ["'self'", ...connectSrcUrls],
//             scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
//             styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//             workerSrc: ["'self'", "blob:"],
//             objectSrc: [],
//             imgSrc: [
//                 "'self'",
//                 "blob:",
//                 "data:",
//                 "https://res.cloudinary.com/douqbebwk/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
//                 "https://images.unsplash.com/",
//             ],
//             fontSrc: ["'self'", ...fontSrcUrls],
//         },
//     })
// );


app.use(session(sessionConfig))
app.use(flash());
// app.use(helmet());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	console.log(req.session)
	res.locals.currentUser = req.user;
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
})

app.use('/', userRoutes);
app.use('/kts-admin', adminRoute)
app.use('/event-owner', eventOwner)
app.use('/invited-individual', invitedIndividual)


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


app.all('*', (req, res, next) => {
	next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = 'Oh No, Something Went Wrong!'
	res.status(statusCode).render('error', { title: "Error", err })
})


app.listen(port, () => {
	console.log(`Listening on port ${port}`)
})
