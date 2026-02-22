
module.exports = function(req, res, next) {
  const headerRole = req.headers['role']; 
  const requestedRole = req.body.role;

  if (!requestedRole) return res.status(400).json({ message: 'Trebuie specificat rolul' });

  
  if (headerRole === 'user' && requestedRole !== 'user') {
    return res.status(403).json({ message: 'Userul nu poate crea cont de admin sau manager' });
  }

  if (headerRole === 'admin' && !['user', 'manager', 'admin'].includes(requestedRole)) {
    return res.status(400).json({ message: 'Rol invalid, trebuie să fie user, manager sau admin' });
  }

  next();
};
