const bcrypt = require("bcrypt");

const hashPassword = async (password, saltRounds) => {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

const verifyPassword = async (password, hashedPassword) => {
  const result = await bcrypt.compareSync(password, hashedPassword);
  return result;
};

module.exports = {
  hashPassword,
  verifyPassword,
};
