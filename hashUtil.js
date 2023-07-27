import dotenv from "dotenv";
import bcrypt from "bcrypt";
// import md5 from "md5";

dotenv.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS);

// export function getHash(val) {
//   return md5(val);
// }

export function getHash(val) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(val, saltRounds, function(err, hash) {
      console.log("bcrypt: " + err);
      console.log("bcrypt: " + hash);
      if(!err) {
        resolve(hash);
      }
      reject(-1);
  });
  })
}

export function compareHash(val, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(val, hash, function(err, result) {
      console.log("compareHash result:"+result);
      if(!err) {
        resolve(result);
      }
      
      reject(false);
    });
  })
}