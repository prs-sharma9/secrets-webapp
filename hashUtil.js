import md5 from "md5";

export function getHash(val) {
  return md5(val);
}