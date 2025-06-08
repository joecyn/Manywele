const express=require("express");
const app=express();
const mongoose=require("mongoose")
const PORT = process.env.PORT || 4000;
const router=require("./Routes/Router")
const path = require('path');

// const userRouter=require("./Routes/UserRouter/userRouter")
const dotenv =require("dotenv")
const cookieParser= require("cookie-parser");
const session=require("express-session")
const flash=require('connect-flash')

//Middlewares

app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'views'));

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

//Error Handling Middleware



app.listen(PORT,()=>{

    console.log(`Server is Listening on port: ${PORT}`)
})

