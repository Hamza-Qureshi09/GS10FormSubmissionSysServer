const mongoose= require("mongoose");

const AnnouncementSchema=new mongoose.Schema({
    Title:{type:String, required:true},
    Semester:{type:String,required:true},
    Only_For:{type:String,required:true},
    Description:{type:String, required:false},
    Authority:{type:String, required:true},
    StartingDate:{type:Date,default:Date.now(),required:true},
    ClosingDate:{type:Date,required:true}
})

const Announcements=new mongoose.model('Announcemnts',AnnouncementSchema);

module.exports=Announcements;