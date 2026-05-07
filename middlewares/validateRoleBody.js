
module.exports = function(req, res, next) {
  const headerRole = req.headers['role']; 
  const requestedRole = req.body.role;

  // Pentru update profil, rolul nu este obligatoriu.
  // (Pentru create, validarea obligatorie este făcută în DTO-ul de create.)
  if (!requestedRole) return next();

  
  if (headerRole === 'user' && requestedRole !== 'user') {
    return res.status(403).json({ message: 'Userul nu poate crea cont de admin sau manager' });
  }

  if (headerRole === 'admin' && !['user', 'manager', 'admin'].includes(requestedRole)) {
    return res.status(400).json({ message: 'Rol invalid, trebuie să fie user, manager sau admin' });
  }

  next();
};
