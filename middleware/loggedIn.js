module.exports.isLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		req.session.returnTo = req.originalUrl
		req.flash('error', 'You must be signed in first!');
		return res.redirect('/login');
	}
	next();
}

module.exports.isAdmin = async (req, res, next) => {
	const { isAdmin } = req.user;
	if (isAdmin !== 2) {
		req.flash('error', 'You do not have permission to access the admin!');
		return res.redirect(`/login`);
	}
	next();
}

module.exports.isEventOwner = async (req, res, next) => {
	const { isAdmin } = req.user;
	if (isAdmin !== 1) {
		req.flash('error', 'You do not have permission to access the event owner!');
		return res.redirect(`/login`);
	}
	next();
}
