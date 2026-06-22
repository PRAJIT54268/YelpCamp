const Campground = require('../models/campground'); // two dots are used because it tells the database to first move out of current folder and then search for models/campgrounds in that folder
// since models is in the main folder to we move out of seeds into main folder and then go to models and then to campgrounds
const cities = require('./cities')
const { places, descriptors } = require('./seedHelpers')
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp')

const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected")
})

const sample = array => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 40; i++) {
        const random40 = Math.floor(Math.random() * 40);
        const price = Math.floor(Math.random() * 30) + 10;
        const camp = new Campground({
            author: '6a339d99987afe7972ab3df4',
            location: `${cities[random40].city}, ${cities[random40].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda, quis reprehenderit debitis repellendus impedit libero non, nobis sunt reiciendis ab repellat et eos. Labore distinctio inventore sequi nobis quis repudiandae?Eveniet ex id, inventore laborum, velit illum perferendis soluta repellendus eius obcaecati, enim quae porro deserunt aut et odit asperiores.Odio vero nulla fuga ipsa aspernatur esse numquam neque dolor.',
            price: `${price}`,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random40].longitude,
                    cities[random40].latitude,
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dmvpwh54r/image/upload/v1781846630/YelpCamp/liryhqdh1sxp14hiu14m.jpg',
                    filename: 'YelpCamp/liryhqdh1sxp14hiu14m'
                }
            ]
        })
        await camp.save();
    }
}

seedDB().then(() => {
    db.close();
})
