import   jwt from "jsonwebtoken";
import {asynchandler} from "../utils/asynchandler.js"
import {apierror} from "../utils/apierror.js"
import { User }from "../models/userSchema.js";

const verifyJWT  = asynchandler (async (req , res , next) =>{ 
  try{
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
      
      if(!token){
        throw new apierror(401 , "unauthorized access ")
      }

      const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET) 
      
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")  
     
      if(!user){
        throw  new apierror(401 , "invalid access token ")
      }

      req.user = user
      next()

  }catch(error){
      throw new apierror(401 , error?.message , "invalid access  token ");
  }


}) 

export {verifyJWT}