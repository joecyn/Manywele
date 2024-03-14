const User=require("../Model/Users")
const bcrypt=require("bcrypt");
const jwt = require("jsonwebtoken")

const LoginController=async(req,res)=>{
    //creating JWT token
    const maxAge=3*26*60*60;
    const createToken=(id,name)=>{
       return jwt.sign({id,name},"mutujaba",{
           expiresIn:maxAge
       });
       
    }
    try{
    const{email,password}=req.body;
    if(!email || !password){
        const Message="All fields are required!"
        //res.send(Message)
        res.render("pages/Login",{Message:Message})

    } 
    
    else{
        const findUser= await User.findOne({email:email})
    if(!findUser) {
        const Message="User does not Exist please Register"
        res.render("pages/Login",{Message:Message})
    } 
    

    const match= await bcrypt.compare(password,findUser.password)

    if(!match) {
        const Message ="Invalid password or User name"
        res.render("pages/Login",{Message:Message})
    }
    else{
        
        const token=createToken(findUser._id,findUser.name);
        res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});
        res.redirect("/")
    }
    
    }
    
    }
    catch(err){
        console.log(err)
    }
    

}
module.exports=LoginController;
