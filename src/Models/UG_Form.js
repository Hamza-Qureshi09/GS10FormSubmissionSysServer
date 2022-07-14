const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UG_Form_Schema = new mongoose.Schema({
    Student_Name: { type: String, required: true },
    Father_Name: { type: String, required: true },
    Registry_No: { type: String, required: false },
    Date_of_First_Submission: { type: Date, default: Date },
    Semester: { type: String, required: true },
    FeeVoucher: { type: String, required: false },
    Program: {
        type: String,
        required: true,
    },
    Courses: {
        type: []
    },
    Status: { type: String, required: false },
    FeePaid: { type: Number, required: true },
    AuthoritiesApproval: {
        type: []
    },
    FormStatus:{type:String,required:true,default:'incomplete'}
}, { timestamps: true });

const UG_Form = new mongoose.model('UG_Form', UG_Form_Schema);
module.exports = UG_Form;