const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const { storeReturnTo } = require('../middleware');
const users = require('../controllers/users');

router.route('/register')
    .get(users.renderRegister)
    .post(catchAsync(users.register));

router.route('/login')
    .get(users.renderLogin)
    .post(
        // use the storeReturnTo middleware to save the returnTo value from session to res.locals
        storeReturnTo,
        // passport.authenticate logs the user in and clears req.session
        passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), // passport creates a middleware authenticate which we pass a stratgy [here local] then we set failureFlash that is for flashing an error and then we have failureRedirect which takes us to a different page on failure
        // Now we can use res.locals.returnTo to redirect the user after login
        users.login)

router.get('/logout', users.logout)

module.exports = router;

