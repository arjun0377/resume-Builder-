import mongoose , {Schema, SchemaType} from "mongoose";
import jwt from "jsonwebtoken";

const skillSchema = new mongoose.Schema ({
  name : {type: String , trim : true},
  level : {type : String , trim : true}
},
 {_id:  true}
)


const educationSchema = new mongoose.Schema({
  degree:{type:String , trim:true} ,
institution: {type: String , trim : true},
year : {type: Date , trim : true},
cgpa : {type: Number , trim : true},
},
{_id:true}
)

const experienceSchema  = new mongoose.Schema({
     company : {type: String , trim : true},
    role : {type: String , trim : true},
    startDate :{type: String , trim : true},
    endDate : {type: String , trim : true},   
},
{_id: true}
) 

const projectSchema  = new mongoose.Schema({
  Projectname : {type: String, trim : true},
  stack : {type: String, trim : true},
  link : {type: String, trim : true},
  description : {type: String , trim : true},
},
{_id: true}
)

const simpleItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    issuer: { type: String, trim: true },
    date: { type: String, trim: true },
    description: { type: String, trim: true }
  },
  { _id: true }
);

const resumeSchema = new Schema({
  owner:{
      type :mongoose.Schema.Types.ObjectId,
      ref :"User",
      required :true,
      index :true
    },

  title: { 
      type: String ,
      trim:true,
      default : "untitled Resume",
  },
  targetRole: {type: String , trim : true ,default : ""},
  
  template: {
    type:String ,
    enum :["modern","classic" , "compect"],
    default : "modern"
  }, 
  
  personalInfo:{
    fullName: { type: String, trim: true, default: "" },
      headline: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      location: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      linkedin: { type: String, trim: true, default: "" },
      github: { type: String, trim: true, default: "" }
  },
  summary:{
    type:String ,
    required: true ,
    trim :true 
  },
  skills: [skillSchema],
  education : [educationSchema],
  experience: [experienceSchema],
  certification : [simpleItemSchema],
  projects : [projectSchema],
  languages : [skillSchema],

  visibility: {
        type: String,
        enum: ["private", "shareable"],
        default: "private"
      }
}
    ,{ timestamps: true } )


export default mongoose.model("ResumeSchema", resumeSchema);