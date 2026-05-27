import { response } from "express";

 const asynchandler = ( responsehandler) =>{
    return(req , res, next )=>{
        Promise.resolve(responsehandler(req , res, next)).catch((err)=>next(err));
    }
 }

 export {asynchandler}