const dayjs = require("dayjs");

const safeParse = (value, defaultValue = {}) => {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
};

const safeParseDate = (value, format = "DD/MM/YYYY") => {
  if (!value || !dayjs(value).isValid()) return "";
  return dayjs(value).format(format);
};

module.exports = { safeParse, safeParseDate };
