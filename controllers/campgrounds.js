// controllers are used just to clean up the code of routes, they just take the route code and export them in form of callbacks which can then be called




const { cloudinary } = require("../cloudinary");
const Campground = require('../models/campground'); // here we need to get to main directory hence going back more places and using two ..
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;


module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 }); // passes the location to geoJSON which returns us the point location of our location on a mapp with coordinates
    // console.log(geoData);
    if (!geoData.features?.length) {
        req.flash('error', 'Could not geocode that location. Please try again and enter a valid location.');
        return res.redirect('/campgrounds/new');
    }
    

    const campground = new Campground(req.body.campground);

    // below we are accessing the geodata object to recieve the info that it returned about our campground 
    campground.geometry = geoData.features[0].geometry; // storing the coordinates here
    campground.location = geoData.features[0].place_name; // storing the place name here


    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename })); // this maps over the array of images and stores the path and filename from them
    campground.author = req.user._id;
    await campground.save();
    console.log(campground.images);
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.showCampground = async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({ // for nested populate you need to use path to set which populate will populate what
        path: 'reviews',
        populate: {
            path: 'author'
        } // populating authors for reviews in order to get the author name and show it when displaying campground reviews
    }).populate('author'); // populating authors in order to get the author name and show it when displaying campground
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id)
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    // console.log(req.body);
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    // console.log(geoData);
    if (!geoData.features?.length) {
        req.flash('error', 'Could not geocode that location. Please try again and enter a valid location.');
        return res.redirect(`/campgrounds/${id}/edit`);
    }

    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });

    campground.geometry = geoData.features[0].geometry;
    campground.location = geoData.features[0].place_name;

    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs); // this spreads the image and adds the new images added to previous images , this is important to do otherwise you will encounter an error
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename); // this removes that image from our cloudinary database as well
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } }) // this will take the images out of that array and hence remove them from that campground
    }
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground')
    res.redirect('/campgrounds');
}
