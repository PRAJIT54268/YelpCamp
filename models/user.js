const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
 
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});
 
UserSchema.plugin(passportLocalMongoose.default); // earlier this line used to be written without default but in the new version we need to include it to avoid error
 
module.exports = mongoose.model('User', UserSchema);