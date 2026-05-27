import mongoose from "mongoose";
import { MONGODB_NAME } from "../../constants.js";

const connectDB = async  ()=>{

  try{
     const connectioninstance = await mongoose.connect(process.env.MONGODB_URI)
     console.log(`\n connect DB : ${connectioninstance.connection.host}` )
  }

  catch(error){
       console.error("MONGODB connection failed : ", error);
       process.exit(1);
  }
    
}

export default connectDB
