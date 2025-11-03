const pagination = (req, res, next) => {
  const { page, limit } = req.query;

  // Parse và validate limit (page size)
  let _limit = parseInt(limit);
  if (!limit || isNaN(_limit) || _limit <= 0) {
    _limit = 10;
  }
  if (_limit > 1000) {
    _limit = 1000;
  }

  // Parse và validate page number
  let _page = parseInt(page);
  if (!page || isNaN(_page) || _page <= 0) {
    _page = 1;
  }

  // Tính skip
  const skip = (_page - 1) * _limit;

  req.pagination = {
    limit: _limit,
    skip: skip,
    page: _page,
  };

  next();
};

module.exports = pagination;
