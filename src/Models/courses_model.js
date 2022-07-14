const mongoose=require("mongoose")

const CoursesSchema=new mongoose.Schema({
    Degree:{
        type:String,
        required:true,
        unique:true
    }, 
    Courses:{
        type:[
            {
                Course_no:{type:String, unique:true, sparse:true, index:true}, 
                Course_name:{type:String,unique:true, sparse:true, index:true}, 
                Credit_hour:{type:Number, sparse:true, index:true}, 
                Course_status:{type:String, sparse:true, index:true, enum:["major","minor","complusory","audit"]},
            }
        ]
    }
    // Courses:[
    //        {
    //            course: {
    //             Course_no:{type:Number, default:45}, 
    //             Course_name:{type:String,default:"plta"}, 
    //             Credit_hour:{type:Number,default:34}, 
    //             Course_status:{type:String,default:"major"},
    //         }
    //        }
    //     ]
},{timestamps:true})

const Courses=new mongoose.model("Courses",CoursesSchema);

module.exports=Courses