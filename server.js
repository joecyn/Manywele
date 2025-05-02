const express=require("express");
const app=express();
const mongoose=require("mongoose")
const PORT = process.env.PORT || 3000;
const router=require("./Routes/Router")

// const userRouter=require("./Routes/UserRouter/userRouter")
const dotenv =require("dotenv")
const cookieParser= require("cookie-parser");
const session=require("express-session")
const flash=require('connect-flash')

//Middlewares
dotenv.config()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(express.static(__dirname + '/public'))

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    
}));
app.use(flash());
app.use(function(req,res,next){
    res.locals.message=req.flash();
    next()
})

//Setting View Engine

app.set('view engine','ejs')
mongoose.set('strictQuery', false)

//DB connection
mongoose.connect(process.env.DB_URL)


        .then(()=>{
            console.log("Connected!")
        })
        .catch((err)=>{
            console.log(err)
        })

app.use("/",router)
// app.use("/Users",userRouter)

// //Error Handling Middleware

// <<<<<<< HEAD
// app.use((err,req,res,next)=>{
//     const errorStatus= err.status || 500;
//     const errorMessage= "Something went Wrong!"
//     //res.status(errorStatus).json(errorMessage) 
//     //console.log(errorMessage)
//     const user=""
//     res.render("Error",{message:errorMessage,user:user})
// =======
// // app.use((err,req,res,next)=>{
// //     const errorStatus= err.status || 500;
// //     const errorMessage= "Something went Wrong!"
// //     //res.status(errorStatus).json(errorMessage) 
// //     //console.log(errorMessage)
// //     const user=""
// //     res.render("pages/Error",{message:errorMessage,user:user})
// >>>>>>> 7a0fe851367e53ce8c5f0adbc3874b023a2cefaf

// // })

app.listen(PORT,()=>{
<<<<<<< HEAD
    console.log(`Server is Listening on PORT: ${PORT}`)
})
=======
    console.log(`Server is Listening port ${PORT}`)
})
>>>>>>> 7a0fe851367e53ce8c5f0adbc3874b023a2cefaf
