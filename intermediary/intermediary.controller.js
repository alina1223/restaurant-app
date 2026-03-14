const IntermediaryService = require('./intermediary.service');
const { body, validationResult } = require('express-validator');



class IntermediaryController {

  static async fetchExternalData(req, res) {
    try {
    
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validare eșuată',
          errors: errors.array(),
          requestId: req.requestId
        });
      }

      const { url, method = 'GET', headers = {}, data = null } = req.body;

      console.log(`[${req.requestId}] 🔄 Procesând cerere intermediară pentru: ${url}`);

     
      const result = await IntermediaryService.fetchFromExternalAPI(
        url,
        method,
        data,
        headers,
        req.requestId
      );

      if (!result.success) {
        return res.status(502).json({
          success: false,
          message: 'Eroare la comunicarea cu API-ul extern',
          error: result.error,
          requestId: req.requestId
        });
      }

      const processedData = IntermediaryService.processData(result.data);

      return res.status(200).json({
        success: true,
        message: 'Date obținute cu succes',
        data: {
          originalData: result.data,
          processedData: processedData,
          metadata: {
            source: url,
            method: method,
            timestamp: new Date().toISOString(),
            requestId: req.requestId
          }
        },
        requestId: req.requestId
      });
    } catch (error) {
      console.error(`[${req.requestId}] ❌ Eroare în fetchExternalData:`, error.message);
      
      return res.status(500).json({
        success: false,
        message: 'Eroare internă a serverului',
        error: {
          type: 'INTERNAL_ERROR',
          message: error.message
        },
        requestId: req.requestId
      });
    }
  }


  static async transformData(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validare eșuată',
          errors: errors.array(),
          requestId: req.requestId
        });
      }

      const { data, operation = 'process', options = {} } = req.body;

      console.log(`[${req.requestId}] ⚙️ Transformând date cu operație: ${operation}`);

      let result = data;

      switch (operation) {
        case 'filter':
          result = IntermediaryService.filterData(data, options);
          break;
        case 'aggregate':
          result = IntermediaryService.aggregateData(data, options);
          break;
        case 'map':
          result = IntermediaryService.mapData(data, options);
          break;
        default:
          result = IntermediaryService.processData(data, options);
      }

      return res.status(200).json({
        success: true,
        message: 'Date transformate cu succes',
        data: {
          original: data,
          transformed: result,
          operation: operation
          ,optionsUsed: options
        },
        requestId: req.requestId
      });
    } catch (error) {
      console.error(`[${req.requestId}] ❌ Eroare în transformData:`, error.message);
      
      return res.status(500).json({
        success: false,
        message: 'Eroare la transformarea datelor',
        error: {
          type: 'TRANSFORMATION_ERROR',
          message: error.message
        },
        requestId: req.requestId
      });
    }
  }

  static async healthCheck(req, res) {
    try {
      const healthStatus = {
        success: true,
        message: 'Serviciul intermediar funcționează',
        status: 'sănătos',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          apiTimeout: process.env.EXTERNAL_API_TIMEOUT || 10000,
          rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || 60000,
          rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || 100
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        },
        requestId: req.requestId
      };

      return res.status(200).json(healthStatus);
    } catch (error) {
      console.error(`[${req.requestId}] ❌ Eroare în healthCheck:`, error.message);
      
      return res.status(503).json({
        success: false,
        message: 'Serviciul nu este disponibil',
        status: 'nefuncțional',
        error: error.message,
        requestId: req.requestId
      });
    }
  }
}

module.exports = IntermediaryController;
