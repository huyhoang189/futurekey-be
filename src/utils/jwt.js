const config = require("../configs");
const JWT = require("jsonwebtoken");

const { secretKeyJWT } = config;

const encode = ({ payload, timeExpired = 10 }) => {
  // Chuyển đổi phút thành giây
  const expirationTime =
    Math.floor(Date.now() / 1000) + parseInt(timeExpired, 10) * 60; // Nhân với 60 để đổi phút thành giây

  return JWT.sign(payload, secretKeyJWT, {
    expiresIn: expirationTime,
  });
};

const decode = async (token) => {
  try {
    return JWT.verify(token, secretKeyJWT);
  } catch (error) {}
};

module.exports = {
  decode,
  encode,
};
