const express = require('express');
const { body } = require('express-validator');
const IntermediaryController = require('./intermediary.controller');

const router = express.Router();


router.get('/health', IntermediaryController.healthCheck);


router.post(
  '/fetch',
  
  body('url')
    .notEmpty().withMessage('URL-ul este obligatoriu')
    .isURL().withMessage('URL-ul trebuie să fie valid'),
  
  body('method')
    .optional()
    .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    .withMessage('Metoda HTTP nu este validă'),
  
  body('headers')
    .optional()
    .isObject().withMessage('Headers trebuie să fie un obiect'),
  
  body('data')
    .optional()
    .isObject().withMessage('Data trebuie să fie un obiect'),

  IntermediaryController.fetchExternalData
);


router.post(
  '/transform',
 
  body('data')
    .custom((value) => {
    
      if (value === undefined || value === null) {
        throw new Error('Data este obligatorie');
      }
     
      if (typeof value !== 'object') {
        throw new Error('Data trebuie să fie un obiect sau array');
      }
      return true;
    }),
  
  body('operation')
    .optional()
    .isIn(['process', 'filter', 'map', 'aggregate'])
    .withMessage('Operație nu este validă'),

  IntermediaryController.transformData
);


router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Informații ale serviciului intermediar',
    data: {
      name: 'Serviciul Intermediar',
      version: '1.0.0',
      description: 'Serviciu backend care acționează ca intermediar între client și resurse externe',
      endpoints: {
        fetch: {
          method: 'POST',
          path: '/api/intermediary/fetch',
          description: 'Obține date din API-uri externe'
        },
        transform: {
          method: 'POST',
          path: '/api/intermediary/transform',
          description: 'Transformă date'
        },
        health: {
          method: 'GET',
          path: '/api/intermediary/health',
          description: 'Verifică starea aplicației'
        }
      },
      features: [
        'Comunicare cu API-uri externe',
        'Timeout configurable',
        'Limitare rate',
        'CORS cu restricție de domenii',
        'RequestId unic per cerere',
        'Validare intrare',
        'Răspunsuri în format standard',
        'Gestionare detaliată a erorilor'
      ],
      configuration: {
        externalApiTimeout: process.env.EXTERNAL_API_TIMEOUT || '10000 ms',
        externalApiRetries: process.env.EXTERNAL_API_RETRIES || '2',
        rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || '60000 ms',
        rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || '10 requests'
      }
    },
    requestId: req.requestId
  });
});

module.exports = router;
