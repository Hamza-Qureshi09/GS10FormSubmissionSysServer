const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    UserImage:{ type: String, default:""},
    isRole: { type: String ,default:"Admin"},
    status:{type:Boolean},
    AccessToken:{type:String}
}, { timestamps: true })

const Admins = mongoose.model('Admins', AdminSchema);

module.exports = Admins