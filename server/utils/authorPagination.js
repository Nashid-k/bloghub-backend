const parsePage = (value) => {
  if (value === undefined) return 1;
  if (!/^[0-9]+$/.test(String(value))) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : null;
};

const parseLimit = (value) => {
  if (value === undefined) return 12;
  if (!/^[0-9]+$/.test(String(value))) return null;
  const limit = Number(value);
  return Number.isSafeInteger(limit) && limit >= 1 ? Math.min(limit, 20) : null;
};

module.exports = { parsePage, parseLimit };
