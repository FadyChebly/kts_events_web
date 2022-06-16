require('dotenv').config()
const nodemailer = require('nodemailer')
const { google } = require('googleapis')
CLIENT_ID = "796793058386-5mfl2b7gqj6r298boo6ekrva2rp649kr.apps.googleusercontent.com"
CLIENT_SECRET = "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"
REDIRECT_URI = "https://developers.google.com/oauthplayground"
REFRESH_TOKEN = "1//04NGUApxn_4YsCgYIARAAGAQSNwF-L9IrJvmZcZLwsbft27N1xhut8aRDXQTDHR6T8Nxd_hVYZdGLKZ1iai3T8kuK3TDM4uC40WQ"
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })


module.exports.newsLetterSubscribe = async (req, res) => {
	const accessToken = await oAuth2Client.getAccessToken()
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			type: 'OAuth2',
			user: process.env.EMAIL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			refreshToken: REFRESH_TOKEN,
			accessToken: accessToken
		}
	});

	var mailOptions = {
		from: 'KTS event website',
		to: process.env.EMAIL,
		subject: 'Newsletter Subscription Request',
		text: 'Hello KTS Team,\n\nKindly note that: ' + req.body.email + ' has requested to subscribe to our Events newsLetter. \n \n' + 'Thank you & Best Regards'
	};
	transporter.sendMail(mailOptions, (err, res) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log('KTS success')
		}
	});

	var mailOptions = {
		from: 'KTS event website',
		to: req.body.email,
		subject: 'Newsletter Subscription Confirmation',
		text: 'Hello from KTS Team,\n\nKindly note that your newsLetter subscription request is being handled by our team. \n \n' + 'Thank you & Best Regards'
	};
	transporter.sendMail(mailOptions, (err, res) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log('customer success')
		}
	});

	res.redirect('/')
}

module.exports.contactUsRequest = async (req, res) => {

	const accessToken = await oAuth2Client.getAccessToken()
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			type: 'OAuth2',
			user: process.env.EMAIL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			refreshToken: REFRESH_TOKEN,
			accessToken: accessToken
		}
	});

	var mailOptions = {
		from: 'KTS event website',
		to: process.env.EMAIL,
		subject: 'Event Owner Contact Request',
		text: `Hello KTS Team,\n\nKindly note that: ${req.body.name} has requested to be reached out. \n \nThese are the informations filled by ${req.body.name} \nName: ${req.body.name} \nEmail: ${req.body.email} \nPhone Number: ${req.body.phone}\nHis Message: ${req.body.feedback}\n\nThank you & Best Regards`
	};
	transporter.sendMail(mailOptions, (err, res) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log('KTS success')
		}
	});

	var mailOptions = {
		from: 'KTS event website',
		to: req.body.email,
		subject: 'Message from KTS event',
		text: 'Hello from KTS Team,\n\nKindly note that your request is being handled by our team. \nWe will be contacting you soon. \n\n' + 'Thank you & Best Regards'
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
}