const mongoose=require("mongoose");
const Schema=mongoose.Schema; 

const roomSchema=new mongoose.Schema({
    RoomType:{type:String, required:true},
    Topic:{type:String, required:true},
    OwnerId:{type:Schema.Types.ObjectId,ref:"User"},
    speakers:{
        type:[
            {
                type:Schema.Types.ObjectId,
                ref:'User'
            }
        ]
    }
},{timestamps:true})

const RoomModel=new mongoose.model("RoomModel",roomSchema);

module.exports=RoomModel;