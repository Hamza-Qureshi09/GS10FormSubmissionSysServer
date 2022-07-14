const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const IncrementId = mongoose.Schema({
    _id: { type: String, required: true },
    seqId: { type: Number, default: 0 }
})

var counter = mongoose.model('counter', IncrementId);


const usersSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    UserId: { type: Number },
    Type:{type:String,required:false,},
    isRole: { type: String, default: "User" },
    UserImage:{ type: String, default: "" },
    UGForm: [
        {
            type: Schema.Types.ObjectId,
            ref: 'UG_Form',
            required: false
        }
    ],
    UGFormSubmissionStatus: { type: String, required: true, default: false },
    status: { type: Boolean },
    AccessToken: { type: String }
}, { timestamps: true });


usersSchema.pre('save', async function (req, res, next) {
    try {
        var doc = this;
        let data = await counter.findByIdAndUpdate({ _id: "1" }, { $inc: { seqId: 1 } }, { new: true, upsert: true });
        if (data) {
            doc.UserId = data.seqId;
            next()
        } else {
            console.log("not incrementing id ");
        }
    } catch (error) {
        console.log(error);
    }
})

const Users = new mongoose.model("Users", usersSchema);

module.exports = Users

