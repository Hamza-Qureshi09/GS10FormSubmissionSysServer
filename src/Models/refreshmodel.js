const mongoose=require("mongoose");
const Schema=mongoose.Schema; 

const refreshSchema=new mongoose.Schema({
    RefreshToken:{type:String, required:true},
    userId:{type:Schema.Types.ObjectId,ref:"User"},
},{timestamps:true})

const RefreshToken=new mongoose.model("RefreshToken",refreshSchema);

module.exports=RefreshToken;