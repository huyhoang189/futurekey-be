const pageNotFound = (req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  return res.status(404).json({
    message: error,
  });
};

module.exports = pageNotFound;
