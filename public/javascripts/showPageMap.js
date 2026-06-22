// to get the maps to work just follow the docs and it will be very easy
// all the maps are based upon the maptiler api
// 1. The User Submits the Form
// Someone types "Jabalpur, Madhya Pradesh" into your location input and clicks submit.

// 2. Your Controller Asks MapTiler
// In your backend (usually inside controllers/campgrounds.js), you likely installed a package called @maptiler/client. Your code takes the text the user typed, attaches your MAPTILER_API_KEY, and sends a request to MapTiler's servers:

// "Hey MapTiler, I need the exact GPS coordinates for 'Jabalpur, Madhya Pradesh'."

// 3. MapTiler Replies with GeoJSON
// MapTiler's servers do the heavy lifting and send back a JSON response

// 4. Saving to MongoDB
// You save that exact GeoJSON object to your database under campground.geometry as mentioned in campgroundSchema in our campground object.

// 5. EJS Injects the Data
// When the page loads, your EJS template takes that database object and prints it directly into your HTML as a JavaScript variable

// 6. MapTiler SDK Draws the Pin
// Finally, your showPageMap.js file uses the MapTiler SDK you linked in your boilerplate. It uses the maptilerApiKey to authenticate, builds the map, and uses those campground.geometry.coordinates to drop a pin:


// for more understanding read the docs while checking the code and also read the comments written inside the codes

// still doubt then rewatch section 55 and 56 of the webDev course


maptilersdk.config.apiKey = maptilerApiKey;

const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.BRIGHT,
    center: campground.geometry.coordinates, // starting position [lng, lat]
    zoom: 10 // starting zoom
});

new maptilersdk.Marker()
    .setLngLat(campground.geometry.coordinates)
    .setPopup(
        new maptilersdk.Popup({ offset: 25 })
            .setHTML(
                `<h3>${campground.title}</h3><p>${campground.location}</p>`
            )
    )
    .addTo(map)