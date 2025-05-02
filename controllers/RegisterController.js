const bcrypt=require("bcrypt")
const Joi =require("joi")
const User=require("../Model/Users")
const jwt =require("jsonwebtoken")

const RegisterController=async(req,res,next)=>{
     //creating JWT token
     const maxAge=3*26*60*60;
     const createToken=(id)=>{
         return jwt.sign({id},process.env.SECRET,{
            expiresIn:maxAge
         });
     }
    const schema=Joi.object().keys({
        name:Joi.string().min(6).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(20).required()

    } )
    const result=schema.validate(req.body)
    const{name,email,password}=req.body;
    if(result.error)
    {   
        
        const Message="FAILED:Please check your details and try again"
        //return res.json({"message":"All fields are required!"})
        //next(Message)
        res.render("Pages/Register",{Message:Message})
    }
    else{
        const findUser= await User.findOne({email:req.body.email})
        const username=await User.findOne({name:req.body.name})
    if(findUser || username){
        const Message="User already Exists. Please Login "
     //return res.json({"Message":"User already exists.Please login"})
       res.render("Pages/Register",{Message:Message})
    }
    else{

        try{
            const hashedPassword= await bcrypt.hash(password,10);
            const newUser= await User.create({name:name,email:email,password:hashedPassword})
            //create token
            const token=createToken({id:newUser._id,name:newUser.name});
            res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});
            //req.flash('message', 'User Created Successfully.Please Login');
            res.redirect("/Login")
        }
        catch(err){
            console.log(err)
        }
    }
    
        
    }
    
    
}
module.exports=RegisterController