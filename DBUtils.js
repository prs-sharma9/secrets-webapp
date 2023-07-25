import dotenv from "dotenv";
import mongoose from "mongoose";
import * as HashUtil from "./hashUtil.js";


dotenv.config();

const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;
var SECRET = process.env.SECRET;

const userSchema = new mongoose.Schema({
    email: {
      type:String,
      required: true
    },
    password: {
      type:String,
      required:true
    }
  });

  const User = mongoose.model(COLLECTION_NAME, userSchema);

export async function connectToDB() {
  await mongoose.connect(`${DB_URL}/${DB_NAME}`);
}

export async function saveNewUser(username, pass){
  const hashedPwd = HashUtil.getHash(pass);
  return new Promise((resolve, reject) => {
    getUserByUsername(username)
    .then((foundUser) => {
      if(!foundUser){
        const newUser = new User({email:username, password:hashedPwd});
        resolve(newUser.save());
      } else {
        reject("User already exist");
      }
    })
    .catch(err => {
      console.error("error while saving new user: " + err);
    });
  });
}


export async function getUserByUsername(username) {
  return User.findOne({email:username}).exec();
}

export function loginUser(username, pass) {

  const hashedPwd = HashUtil.getHash(pass);
  return new Promise((resolve, reject) => {
    getUserByUsername(username)
    .then((user) => {
      if(user && user.password === hashedPwd) {
        resolve(true);
      } else {
        reject("invalid username or password");
      }
    })
    .catch(err=> {
      console.log(err);
      reject(err);  
    });
  });

}