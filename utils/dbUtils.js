import "dotenv/config";
import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import * as HashUtil from "../hashUtil.js";

const postCollectionName = "Post";
const userCollectionName = "User";
const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;

// Declare Schema for Users and Posts Collection

const userCollectionSchema = new mongoose.Schema({
  username: String,
  strategy: String,
  name: String
  // password field is not required
  // for local strategy password will be add by Passport-local-mongoos in the form of salt and hash
  // for other strategy like google we will authenticate via google so password is not requried
  // password: String
});

const postCollectionSchema = new mongoose.Schema({
  username: String,
  post: String
});

// Adding Passport plugin to Users collection

userCollectionSchema.plugin(passportLocalMongoose);

// Create model class for Users and Posts Schema


export const User = mongoose.model(userCollectionName, userCollectionSchema);
export const Post = mongoose.model(postCollectionName, postCollectionSchema);


export async function connectToDB() {
  await mongoose.connect(`${DB_URL}/${DB_NAME}`);
  console.log("DBUtils: Connected to DB");
}

export async function getUserByUserId(user_Id) {
  return User.findOne({username:user_Id}).exec();
}

// LOCAL STRATEGY: Start

// This approach of saving new user is not suitable for session management. See registerNewUser method for session support

// async function save(user_Id, pass) {
//   return new Promise((resolve, reject) => {
//     getUserByUserId(user_Id)
//     .then((foundUser) => {
//       if(!foundUser) {
//         return HashUtil.getHash(pass);
//       } else {
//         reject("User already exist");
//       }
//     })
//     .then((hashPass) => {
//       if(!hashPass != -1) {
//         const newUser = new User({
//           userId:user_Id, 
//           strategy: "local",
//           password: hashPass,
//           name: user_Id
//         });
//         return newUser.save();
//       } else {
//         reject("Error while Hashing password, Please try again !!");
//       }
//     })
//     .catch(err => reject(err));
//   })
// }

// In the below method User.register method is provided by passport-local-mongoose.
// This method will take new user instance and password and insert user along with salt and hash for password.
export function registerNewUser(user_Id, pass, strategy = "local") {
  const newUser = new User({
    username: user_Id,
    strategy: strategy,
    name: user_Id
  });
  return new Promise((resolve, reject) => {
    User.register(newUser, pass, function(err, user) {
      if (err) {
          reject(err);
      }
      resolve(user);
    });
  });
}

// LOCAL STRATEGY: End


// GOOGLE STRATEGY: Start

export async function findOrCreate(googleUser, cb) {
  console.log("findOrCreate: START");
  try {
    let doc = await User.findOne({username: googleUser.username}).exec();
    if(!doc) {
      console.log(`saving new user : ${googleUser.name}`);
      doc = await googleUser.save();
    }
    cb(null, doc);
  } catch(err) {
    cb(err, {});
  }
  
}

// GOOGLE STRATEGY: End


// Post collections methods

export async function findAllPost() {
  return await Post.find();
}

export function findAllPostForUser(user_Id) {

}

export async function savePost(newPost) {
  await newPost.save();
}































