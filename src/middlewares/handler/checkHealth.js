const logger = require("../../loggers");

const checkHealth = (req, res) => {
  logger.info("Server is running on port {}");
  return res.send("The server is health !!!");
};
module.exports = checkHealth;
