import dotenv from "dotenv";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";

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

  // enable encryption of password field on schema object
  userSchema.plugin(encrypt, { secret: SECRET, encryptedFields:["password"] });

  const User = mongoose.model(COLLECTION_NAME, userSchema);

export async function connectToDB() {
  await mongoose.connect(`${DB_URL}/${DB_NAME}`);
}

export async function saveNewUser(username, pass){
  return new Promise((resolve, reject) => {
    getUserByUsername(username)
    .then((foundUser) => {
      if(!foundUser){
        const newUser = new User({email:username, password:pass});
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