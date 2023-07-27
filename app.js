import 'dotenv/config'
import bodyParser from "body-parser";
import express from "express";
import * as dbUtils from "./utils/dbUtils.js";

import session from "express-session";
import passport from "passport";
import passportGoogle from "passport-google-oauth20";


const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const googleStrategy = passportGoogle.Strategy;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// To support login via email/password enabling LOCAL STRATEGY in passport
passport.use(dbUtils.User.createStrategy());

// To login via Google, enabling GOOGLE STRATEGY in passport
passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function (accessToken, refreshToken, profile, cb) {
    console.log("Google Response");
    console.log("displayname " + profile.displayName);
    console.log("username " + profile.id);
    const googleUser = new dbUtils.User({
      username: profile.id,
      strategy: "google",
      name: profile.displayName
    });
    dbUtils.findOrCreate(googleUser, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.serializeUser( (user, done) => {
  done(null, user)
})
passport.deserializeUser((user, done) => {
  done (null, user)
})


const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(`Server started at port: ${PORT}`);
  dbUtils.connectToDB();
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

app.get("/logout", (req,res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get("/secrets", (req, res) => {
  // check if user is already authenticated
  let userName = "Guest";
  
  if(req.isAuthenticated()) {
    userName = req.user.name;
  } 
  const postList = dbUtils.findAllPost();
  postList.then((data) => {
    const list = [];
    data.forEach(item => list.push(item.post));
    res.render("secrets", {username: userName, posts: list});
  })
  

  

});

app.get("/submit", (req, res) => {
  if(req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.render("login");
  }
});


app.post('/register', function(req, res) {

  console.log("register new user");
  dbUtils.registerNewUser(req.body.username, req.body.password)
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
  const user = new dbUtils.User({
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

app.post("/submit", (req, res) => {
  if(req.isAuthenticated()) {
    const newPost = new dbUtils.Post({
      username: req.user.username,
      post: req.body.secret
    });
    dbUtils.savePost(newPost);
    res.redirect("/secrets");
  } else {
    console.log("User not authenticated, cannot post secret. Please login again !")
    res.render("login");
  }
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
  );

  app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });