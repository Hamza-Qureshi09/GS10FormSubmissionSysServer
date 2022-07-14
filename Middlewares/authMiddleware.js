const jwt=require("jsonwebtoken");
const user=require("../src/Models/user_model");

const authMiddleware= async(req,res,next)=>{
    try {
        const AccessToken=req.cookies.AccessToken;
        if(!AccessToken){ 
            throw new Error()
        }
        const userData=await jwt.verify(AccessToken,process.env.AccessToken_Secret)
        if(!userData){
            throw new Error()
        }
        const validUser= await user.findOne({_id:userData._id})
        if(validUser){
            req.User=validUser
            next();
        }
    } catch (error) {
        res.status(401).json({Message:"Error in AuthMiddleware" ,Error:error})
    }
}
module.exports=authMiddleware;