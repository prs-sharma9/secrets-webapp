// import dotenv from "dotenv";
import 'dotenv/config'
import bodyParser from "body-parser";
import express from "express";
import * as DBUtils from "./DBUtils.js";

import session from "express-session";
import passport from "passport";
import passportGoogle from "passport-google-oauth20";

// dotenv.config();
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const GoogleStrategy = passportGoogle.Strategy;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
  // cookie: {secure: true}
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(DBUtils.User.createStrategy());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function (accessToken, refreshToken, profile, cb) {
  console.log("Profile returned from google");
  DBUtils.findOrCreate({ googleId: profile.id }, function (err, user) {
    console.log("GoogleStrategy Callback")
    console.log(err);
    console.log(user);
    return cb(err, user);
  });
}
));

// passport.serializeUser(DBUtils.User.serializeUser());
// passport.deserializeUser(DBUtils.User.deserializeUser());

passport.serializeUser( (user, done) => {
  console.log("SerializeUser: "+user);
  done(null, user)
})
passport.deserializeUser((user, done) => {
  console.log("deserializeUser: "+user);
  done (null, user)
})


const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(`Server started at port: ${PORT}`);
  DBUtils.connectToDB();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req,res) => {
  res.render("register");
});

app.get("/login", (req,res) => {
  res.render("login");
});

// app.post("/register", async (req,res) => {
//   const promise = DBUtils.saveNewUser(req.body.username, req.body.password);
//   if(promise === -1) {res.render("error", {error: "Something went horribly wrong"}); } 
//   promise.then(() => res.render("secrets"))
//   .catch(err=> {
//     console.log(err);
//     res.render("error", {error: err});  
//   });
// });

// app.post("/login", async (req,res) => {

//   const username = req.body.username;
//   const password = req.body.password;
//   DBUtils.loginUser(username, password)
//   .then((success) => {
//     if(success) {
//       res.render("secrets");
//     } else {
//       res.render("error", {error:"invalid username or password"});
//     }
//   })
//   .catch((err) => {
//     console.log(err);
//     res.render("error", {error:err}); 
//   });
// });

app.get("/logout", (req,res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get("/secrets", (req, res) => {
  // check if user is already authenticated
  if(req.isAuthenticated()) {
    res.render("secrets", {username: req.user.username});
  } else {
    res.render("login");
  }
  
});

app.post('/register', function(req, res) {

  console.log("register new user");
  DBUtils.registerNewUser(req.body.username, req.body.password)
  .then((user) => {
    passport.authenticate('local')(req, res, function () {
      res.redirect('/secrets');
    });
  })
  .catch(err => {
    console.error("error while registering user: " + err);
    res.render("error", {error: err});
  })
});


app.post("/login", (req, res) => {
  const user = new DBUtils.User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if(err) {
      console.error(err);
      res.render("error", {error:"Invalid Username or Password"})
    } else {
      passport.authenticate('local')(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

// const verify = function (accessToken, refreshToken, profile, cb) {
//   User.findOrCreate({ googleId: profile.id }, function (err, user) {
//     return cb(err, user);
//   });
// }



app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
  );

  app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });