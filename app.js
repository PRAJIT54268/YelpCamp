// whenever using any server it is recommended to use your current ip but it changes everytime you start your system or do a connection change hence you can add  0.0.0.0/0 as your ip address , it includes every ip address, hence you don't need to add a different ip address everytime you change or start your system



if (process.env.NODE_ENV !== "production") { // this tells the app to acquire the dotenv file when we are developing the file and not when we have deployed the file
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const Review = require('./models/review');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet'); // read about helmet on MDN and learn more about it's functions
const mongoSanitize = require('express-mongo-sanitize');
const sanitizeV5 = require('./utils/mongoSanitizeV5.js');
const { MongoStore } = require('connect-mongo');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'; // allows us to use either of them

mongoose.connect(dbUrl); // this connects us to our main mongo database where our real users are stored

// mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.set('query parser', 'extended');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'))) // this allows us to use our static assets which are stored inside public directory
// Static assets are files that the server sends to the browser as-is, without generating or modifying them.

app.use(sanitizeV5({ replaceWith: '_' })); // it replaces any invalid query with underscore


const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret,
    }
});


store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: { // the following properties are for cookies only
        httpOnly: true, // this is for security and will not allow cookie to be shown on client side allows prevenyts it from going to third party
        // secure: true, // what this does it only allows our website to run on https and not http as it is more secure and prevents security issues
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // our date.now is in milliseconds hence we are converting it into weeks , expires sets an exact date and time when the cookie should expire.
        maxAge: 1000 * 60 * 60 * 24 * 7 // maxAge specifies how many milliseconds from now the cookie should live.
    }
}
app.use(session(sessionConfig)); // needed to be passed in order to use session and flash
app.use(flash()); // session must be passed before passport in order to use passport session

app.use(helmet()); // helmet is used to just add basic security features to our app but when you developing a full scale app then read about each security and then add it to your app

// below we are specifying the scripts , styles, other urls which we are actually not saved locally and will be using the online version of
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    // "https://api.tiles.mapbox.com/",
    // "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", // add this
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    // "https://api.mapbox.com/",
    // "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", // add this
];
const connectSrcUrls = [
    // "https://api.mapbox.com/",
    // "https://a.tiles.mapbox.com/",
    // "https://b.tiles.mapbox.com/",
    // "https://events.mapbox.com/",
    "https://api.maptiler.com/", // add this
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({ // this is a very strict helmet function which only allows specified websites/urls to display image or anything , hence to use anything you need to specify it inside the content security policy function of helmet
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dmvpwh54r/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                // all your other existing code

                // add this:
                "https://api.maptiler.com/", // so we can include maptiler in our website
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // we want passport to use the localStrategy required , and in their authenticate( pre made function in passport ) the User model

passport.serializeUser(User.serializeUser()); // tells how to arrange/store the users
passport.deserializeUser(User.deserializeUser()); // how to get the user out of the session

app.use((req, res, next) => {  // middleware to show flash messages easily 
    res.locals.currentUser = req.user; // now we have access to currentUser at all times 
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes) // for campgrounds , the same problem doesn't occur in campgrounds because we are actually forming id's inside it only     
app.use('/campgrounds/:id/reviews', reviewRoutes) // for campground reviews , when we actually pass this in our router actually seperates the campground and id from reviews and reviews will give error check fix in reviews.js using mergeParams

app.get('/', (req, res) => {
    res.render('home')
});




// const validateCampground = (req, res, next) => {
//     const { error } = campgroundSchema.validate(req.body); // this lines passes our data into the JOI schema that we have created and if their is an error then we store that error in error
//     if (error) {
//         const msg = error.details.map(el => el.message).join(',') // here error.details is an array hence we need to map over it to store the message and join is their to connect messages if more than one
//         throw new ExpressError(msg, 400) // and this throws that error to the error handlers which renders them on our page      
//     } else {
//         next();
//     }
// }

// const validateReview = (req, res, next) => {
//     const { error } = reviewSchema.validate(req.body);
//     if (error) {
//         const msg = error.details.map(el => el.message).join(',')
//         throw new ExpressError(msg, 400)
//     } else {
//         next();
//     }
// }

// app.get('/', (req, res) => {
//     res.render('home') // here views is not written because home is not in a sub directory of views , and views can be directly accessed by app.js
// });
// app.get('/campgrounds', catchAsync(async (req, res) => {
//     const campgrounds = await Campground.find({});
//     res.render('campgrounds/index', { campgrounds })
// }));

// app.get('/campgrounds/new', (req, res) => {
//     res.render('campgrounds/new');
// })


// app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
//     // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
//     const campground = new Campground(req.body.campground);
//     await campground.save();
//     res.redirect(`/campgrounds/${campground._id}`)
// }))

// app.get('/campgrounds/:id', catchAsync(async (req, res,) => {
//     const campground = await Campground.findById(req.params.id).populate('reviews')
//     res.render('campgrounds/show', { campground });
// }));

// app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
//     const campground = await Campground.findById(req.params.id)
//     res.render('campgrounds/edit', { campground });
// }))

// app.put('/campgrounds/:id', validateCampground, catchAsync(async (req, res) => {
//     const { id } = req.params;
//     const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }); // this is a spread function
//     res.redirect(`/campgrounds/${campground._id}`)
// }));

// app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
//     const { id } = req.params;
//     await Campground.findByIdAndDelete(id); // if you change the method of deleting then you also need to see if that method is compatible with mongoose middleware so that we can also delete the reviews of the deleted campground
//     res.redirect('/campgrounds');
// }));

// app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res) => {
//     const campground = await Campground.findById(req.params.id);
//     const review = new Review(req.body.review); // we find the body of the review
//     campground.reviews.push(review); // we add the review to the list of reviews for a campground
//     await review.save(); // save both of them
//     await campground.save();
//     res.redirect(`/campgrounds/${campground._id}`); // redirect to the campground where they are displayed 
// }))

// app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
//     const { id, reviewId } = req.params;
//     await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); // what pull does is it takes and removes the review with that id from it's array of reviews
//     await Review.findByIdAndDelete(reviewId);
//     res.redirect(`/campgrounds/${id}`);
// }))




app.all('/{*path}', (req, res, next) => { // this is because the new version of express doesn't support the normal version of app.all with just a star
    next(new ExpressError('Page Not Found', 404))
}) // this is for if a user goes to an unmatched route then the browser will show this on the error page

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})