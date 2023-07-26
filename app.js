import dotenv from "dotenv";
import bodyParser from "body-parser";
import express from "express";
import * as DBUtils from "./DBUtils.js";

import session from "express-session";
import passport from "passport";

dotenv.config();
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
  // cookie: {secure: true}
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(DBUtils.User.createStrategy());

passport.serializeUser(DBUtils.User.serializeUser());
passport.deserializeUser(DBUtils.User.deserializeUser());


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
        res.redirect('/secrets');
      });
    }
  });
});