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
const MongoStore = require('connect-mongo');

//Middlewares

app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'Views'));


dotenv.config()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(express.static(__dirname + '/public'))


// app.use(session({
//     secret: 'keyboard cat',
//     resave: true,
//     saveUninitialized: true,
    
// }));
// Configure session with MongoStore
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat', // Use env variable in production
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DB_URL, // MongoDB connection string
      collectionName: 'sessions', // Optional: name of the collection for sessions
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // Session expires after 1 day
  })
);
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

