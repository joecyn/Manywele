const express=require("express");
const Router=express.Router();
const LoginController=require("../../controllers/LoginController")
const RegisterController=require("../../controllers/RegisterController");
const isAuthenticated=require("../../Middlewares/Auth")




//Login
Router.get("/Login",(req,res)=>{
    const Message=""
   res.render("/Login",{Message:Message})
   })

Router.post("/Login",LoginController)

//Register
Router.get("/Register",(req,res)=>{
    const Message =" "
    res.render("/Register",{Message:Message})
})
Router.post("/Register",RegisterController)

//SIGNOUT ROUTE
Router.get("/SignOut",isAuthenticated,(req,res)=>{
    res.cookie("jwt"," ",{maxAge:1});
    res.redirect("/User/Login")
}
)

module.exports=Router;