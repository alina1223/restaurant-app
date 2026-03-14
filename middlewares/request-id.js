const { v4: uuidv4 } = require('uuid');


module.exports = (req, res, next) => {
 
  req.id = uuidv4();
  req.requestId = req.id;

  res.setHeader('X-Request-Id', req.requestId);
  console.log(`[RequestId: ${req.requestId}] ${req.method} ${req.path}`);

  
  const originalJson = res.json;
  res.json = function(data) {
   
    if (typeof data === 'object' && data !== null) {
      data.requestId = req.requestId;
    }
    return originalJson.call(this, data);
  };

  next();
};
