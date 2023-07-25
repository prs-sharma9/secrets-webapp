import dotenv from "dotenv";
import bodyParser from "body-parser";
import express from "express";
import * as DBUtils from "./DBUtils.js";

dotenv.config();
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

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

app.post("/register", async (req,res) => {
  const promise = DBUtils.saveNewUser(req.body.username, req.body.password);
  console.log("9");
  promise.then(() => res.render("secrets"))
  .catch(err=> {
    console.log(err);
    res.render("error", {error: err});  
  });
});

app.post("/login", async (req,res) => {
  const promise = DBUtils.getUserByUsername(req.body.username);
  promise.then((user) => {
    if(user && user.password === req.body.password) {
      res.render("secrets");
    } else {
      res.render("error", {error:"invalid username or password"});
    }
  })
  .catch(err=> {
    console.log(err);
    res.render("error", {error:err});  
  });
});

app.get("/logout", (req,res) => {
  res.render("home");
})