
function productsUppercase(req, res, next) {
  if (res.locals.products) {
    res.locals.products = res.locals.products.map(p => ({
      ...p,
      name: p.name.toUpperCase()
    }));
  }
  next();
}


function usersUppercase(req, res, next) {
  if (res.locals.users) {
    res.locals.users = res.locals.users.map(u => ({
      ...u,
      name: u.name.toUpperCase()
    }));
  }
  next();
}

module.exports = { productsUppercase, usersUppercase };