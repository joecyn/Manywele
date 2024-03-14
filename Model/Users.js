const mongoose=require("mongoose");

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        lowerCase:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        lowerCase:true
    },
    password:{
        type:String,
        required:true,
        trim:true,
        lowerCase:true
    },
    isAdmin:{
        type:Boolean,
        default:false
    }
})
const User= mongoose.model("User",UserSchema);
module.exports=User