const ExternalApiService = require('../services/external-api.service');


class IntermediaryService {
  static async fetchFromExternalAPI(url, method = 'GET', data = null, headers = {}, requestId = 'unknown') {
    try {
      if (!this._isValidUrl(url)) {
        return {
          success: false,
          error: {
            type: 'INVALID_URL',
            message: `URL nevalid: ${url}`
          }
        };
      }

      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      if (!validMethods.includes(method.toUpperCase())) {
        return {
          success: false,
          error: {
            type: 'INVALID_METHOD',
            message: `Metoda HTTP nevalid: ${method}. Valide: ${validMethods.join(', ')}`
          }
        };
      }

      const options = { headers };
      const upperMethod = method.toUpperCase();

      console.log(`[${requestId}] 🌐 Comunicând cu API-ul extern: ${upperMethod} ${url}`);

      let result;
      switch (upperMethod) {
        case 'POST':
          result = await ExternalApiService.post(url, data, options, requestId);
          break;
        case 'PUT':
          result = await ExternalApiService.put(url, data, options, requestId);
          break;
        case 'DELETE':
          result = await ExternalApiService.delete(url, options, requestId);
          break;
        default:
          result = await ExternalApiService.get(url, options, requestId);
      }

      return result;
    } catch (error) {
      console.error(`[${requestId}] ❌ Eroare în fetchFromExternalAPI:`, error.message);
      
      return {
        success: false,
        error: {
          type: 'FETCH_ERROR',
          message: error.message
        }
      };
    }
  }

  static processData(data) {
    console.log('📊 Procesând date...');

    if (!data) {
      return null;
    }
    if (Array.isArray(data)) {
      return data.map(item => this._normalizeItem(item));
    }
    if (typeof data === 'object') {
      return this._normalizeItem(data);
    }
    return data;
  }

  static filterData(data) {
    console.log('🔍 Filtrând date...');

    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter(item => {
      if (item === null || item === undefined) return false;
      if (typeof item === 'object' && Object.keys(item).length === 0) return false;
      return true;
    });
  }

  static aggregateData(data) {
    console.log('📈 Agregând date...');

    if (!Array.isArray(data)) {
      return { count: 1, data: data };
    }

    const aggregated = {
      count: data.length,
      items: data,
      summary: {
        firstItem: data[0] || null,
        lastItem: data[data.length - 1] || null,
        totalItems: data.length
      }
    };

    const numbers = data.filter(item => typeof item === 'number');
    if (numbers.length > 0) {
      aggregated.statistics = {
        sum: numbers.reduce((a, b) => a + b, 0),
        average: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        min: Math.min(...numbers),
        max: Math.max(...numbers)
      };
    }

    return aggregated;
  }

  static mapData(data, options = {}) {
    console.log('🗺️ Mapeând date...');

    if (!Array.isArray(data)) {
      return data;
    }

    const pick = Array.isArray(options?.pick) ? options.pick.map((k) => String(k)) : null;
    const rename = (options && typeof options.rename === 'object' && options.rename !== null && !Array.isArray(options.rename)) ? options.rename : null;

    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        let out = { ...item };

        if (pick && pick.length) {
          const picked = {};
          for (const key of pick) {
            if (Object.prototype.hasOwnProperty.call(out, key)) picked[key] = out[key];
          }
          out = picked;
        }

        if (rename) {
          for (const [fromKey, toKeyRaw] of Object.entries(rename)) {
            const toKey = String(toKeyRaw);
            if (!toKey || fromKey === toKey) continue;
            if (Object.prototype.hasOwnProperty.call(out, fromKey)) {
              out[toKey] = out[fromKey];
              delete out[fromKey];
            }
          }
        }

        return {
          ...out,
          processed: true,
          processedAt: new Date().toISOString()
        };
      }
      return item;
    });
  }

  static _normalizeItem(item) {
    if (typeof item !== 'object' || item === null) {
      return item;
    }

    const normalized = { ...item };

    Object.keys(normalized).forEach(key => {
      if (normalized[key] === '' || normalized[key] === null) {
        normalized[key] = null;
      }
    });

    normalized.normalized = true;
    normalized.normalizedAt = new Date().toISOString();

    return normalized;
  }

  static _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = IntermediaryService;
