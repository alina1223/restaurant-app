
module.exports = (req, res, next) => {
  
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    
    if (data && typeof data === 'object' && 'success' in data && 'statusCode' in data) {
      return originalJson(data);
    }

  
    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 300;

    const formattedResponse = {
      success: isSuccess,
      statusCode: statusCode,
      message: data?.message || (isSuccess ? 'Request successful' : 'Request failed'),
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };

   
    if (data && typeof data === 'object' && 'data' in data) {
      formattedResponse.data = data.data;
    } else if (Array.isArray(data) || (data && typeof data !== 'object')) {
      formattedResponse.data = data;
    } else if (data && typeof data === 'object') {
      const { message, error, errors, details, ...rest } = data;
      if (Object.keys(rest).length > 0) {
        formattedResponse.data = rest;
      }
    }

   
    if (data?.errors) {
      formattedResponse.errors = data.errors;
    }


    if (!isSuccess && (data?.error || data?.details)) {
      formattedResponse.error = data.error || data.details || 'Unknown error';
    }

    return originalJson(formattedResponse);
  };

  next();
};
