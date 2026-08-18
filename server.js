const express=require("express");
const app=express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose=require("mongoose")
const dotenv =require("dotenv")
dotenv.config();
const PORT = Number(process.env.PORT) || 4000;
const ALTERNATE_PORT = Number(process.env.ALTERNATE_PORT) || 4001;
const router=require("./Routes/Router")
const path = require('path');

// const userRouter=require("./Routes/UserRouter/userRouter")
const cookieParser= require("cookie-parser");
const session=require("express-session")
const flash=require('connect-flash')
const MongoStore = require('connect-mongo');
const csurf = require('csurf');

//Middlewares

app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'views'));

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(express.static(__dirname + '/public'))

// CSRF protection using double-submit cookie
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production'
  }
});

// apply CSRF protection to all routes
app.use(csrfProtection);

// expose token to views on safe methods
app.use((req, res, next) => {
  try {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken();
    }
  } catch (err) {
    // ignore token errors here; csurf will enforce on unsafe methods
  }
  next();
});

app.use((req, res, next) => {
  res.locals.showSearch = false;
  res.locals.user = null;
  next();
});


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

// DB connection and server startup helper
const startServer = (PORT) => {
  const server = app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please free the port or set PORT env var.`);
      process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
  });
};

// Ensure the desired PORT is available before starting
const ensurePortAvailable = (PORT) => {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const tester = net.createServer()
      .once('error', (err) => {
        tester.close?.();
        reject(err);
      })
      .once('listening', () => {
        tester.close(() => resolve());
      })
      .listen(PORT);
  });
};

// DB connection
const dbUrl = process.env.DB_URL;
const boot = async () => {
  let activePort = PORT;

  try {
    await ensurePortAvailable(activePort);
  } catch (err) {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${activePort} appears to be in use. Falling back to port ${ALTERNATE_PORT}.`);
      activePort = ALTERNATE_PORT;
      try {
        await ensurePortAvailable(activePort);
      } catch (fallbackErr) {
        console.error(`Fallback port ${activePort} is also unavailable: ${fallbackErr.message || fallbackErr}`);
        process.exit(1);
      }
    } else {
      console.error(`Port ${activePort} appears to be unavailable: ${err.message || err}`);
      process.exit(1);
    }
  }

  if (!dbUrl) {
    console.warn('DB_URL not set — starting server without DB connection (development only)');
    app.use('/', router);
    startServer(activePort);
    return;
  }

  mongoose
    .connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Connected to DB');
      app.use('/', router);
      startServer(activePort);
    })
    .catch((err) => {
      console.error('DB connection error:', err && err.message ? err.message : err);
      // start server anyway to allow testing pages that don't require DB
      app.use('/', router);
      startServer(activePort);
    });
};

boot();

module.exports = app;

