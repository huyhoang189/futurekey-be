const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const { decode } = require("../../utils/jwt");
const { HEADER } = require("../../common");

const checkAuth = async (req, res, next) => {
  const accessToken = req.headers[HEADER.AUTHORIZATION];

  if (!accessToken) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: ReasonPhrases.UNAUTHORIZED,
      code: StatusCodes.UNAUTHORIZED,
    });
  }

  const user = await decode(accessToken?.replace("Bearer", "")?.trim());

  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: ReasonPhrases.UNAUTHORIZED,
      code: StatusCodes.UNAUTHORIZED,
    });
  }

  // Attach user session to request
  req.userSession = user;

  return next();
};

module.exports = checkAuth;
