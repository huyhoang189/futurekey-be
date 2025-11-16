const buildWhereClause = (filters = {}) => {
  const where = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue; // chỉ bỏ qua undefined

    if (key === "OR" || key === "AND" || key === "NOT") {
      where[key] = Array.isArray(value)
        ? value.map((condition) => buildWhereClause(condition))
        : buildWhereClause(value);
      continue;
    }

    if (value === null) {
      where[key] = { equals: null };
      continue;
    }

    if (key.endsWith("_not_in")) {
      const field = key.replace("_not_in", "");
      where[field] = { notIn: Array.isArray(value) ? value : [value] };
      continue;
    }

    if (key.endsWith("_not")) {
      const field = key.replace("_not", "");
      where[field] = { not: value };
      continue;
    }

    if (key.endsWith("_in")) {
      const field = key.replace("_in", "");
      where[field] = { in: Array.isArray(value) ? value : [value] };
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      where[key] = { ...value };
      continue;
    }

    if (Array.isArray(value)) {
      where[key] = { in: value };
      continue;
    }

    if (typeof value === "string") {
      where[key] = { contains: value, mode: "insensitive" };
      continue;
    }

    where[key] = { equals: value };
  }

  return where;
};

module.exports = {
  buildWhereClause,
};
