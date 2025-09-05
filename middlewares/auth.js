
module.exports = function(role) {
  return (req, res, next) => {
    
    const userRole = req.headers['role'];
    if (!userRole) {
      return res.status(401).json({ message: 'Nu s-a trimis rolul' });
    }
    if (userRole !== role) {
      return res.status(403).json({ message: 'Acces interzis' });
    }
    next();
  };
};
