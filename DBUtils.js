import dotenv from "dotenv";
import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import * as HashUtil from "./hashUtil.js";

dotenv.config();

const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;
// var SECRET = process.env.SECRET;

const userSchema = new mongoose.Schema({
    email: {
      type:String,
    },
    password: {
      type:String,
    }
  });

  userSchema.plugin(passportLocalMongoose);

 export const User = mongoose.model(COLLECTION_NAME, userSchema);

export async function connectToDB() {
  await mongoose.connect(`${DB_URL}/${DB_NAME}`);
  console.log("DBUtils: Connected to DB");
}

export async function saveNewUser(username, pass){
  return new Promise((resolve, reject) => {
    getUserByUsername(username)
    .then((foundUser) => {
      if(!foundUser){
        HashUtil.getHash(pass)
        .then((hashedPwd) => {
          if(hashedPwd !== -1) {
            const newUser = new User({email:username, password:hashedPwd});
            resolve(newUser.save());
          } else {
          reject("User already exist");
          }
        })
        .catch(err => {
          reject("error while saving new user: " + err);
        })
      }
    })
  });
}


export async function getUserByUsername(username) {
  return User.findOne({email:username}).exec();
}

export function loginUser(username, inputPassword) {

  // const hashedPwd = HashUtil.getHash(inputPassword);
  return new Promise((resolve, reject) => {
    getUserByUsername(username)
    .then((user) => {
      if(user) {
        HashUtil.compareHash(inputPassword, user.password)
        .then(result => resolve(result))
        .catch(err => reject("Error while login: "+err))
      }
    })
    .catch(err=> {
      console.log(err);
      reject(err);  
    });
  });

}


export function registerNewUser(username, password) {

  return new Promise((resolve, reject) => {
    User.register(new User({ username : username }), password, function(err, user) {
      if (err) {
          reject(err);
      }
      resolve(user);
    });
  });
}