const axios = require('axios');

class ExternalApiService {
  constructor() {
    this.timeout = parseInt(process.env.EXTERNAL_API_TIMEOUT) || 10000;
    this.maxRetries = parseInt(process.env.EXTERNAL_API_RETRIES) || 2;

    this.client = axios.create({
      timeout: this.timeout
    });
  }

  async get(url, options = {}, requestId = 'unknown') {
    return this._makeRequest('GET', url, null, options, requestId);
  }

  async post(url, data = {}, options = {}, requestId = 'unknown') {
    return this._makeRequest('POST', url, data, options, requestId);
  }

  async put(url, data = {}, options = {}, requestId = 'unknown') {
    return this._makeRequest('PUT', url, data, options, requestId);
  }

  async delete(url, options = {}, requestId = 'unknown') {
    return this._makeRequest('DELETE', url, null, options, requestId);
  }

  async _makeRequest(method, url, data, options, requestId, retryCount = 0) {
    try {
      console.log(`[${requestId}] 📤 Solicitando ${method} ${url}`);
      
      const config = {
        method,
        url,
        timeout: this.timeout,
        ...options
      };

      if (data) {
        config.data = data;
      }

      const response = await this.client.request(config);
      
      console.log(`[${requestId}] ✅ Respuesta exitosa de ${url} (${response.status})`);
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      console.error(`[${requestId}] ❌ Error en ${method} ${url}:`, error.message);

      if (error.code === 'ECONNABORTED' && retryCount < this.maxRetries) {
        console.log(`[${requestId}] 🔄 Reintentando (${retryCount + 1}/${this.maxRetries})...`);
        return this._makeRequest(method, url, data, options, requestId, retryCount + 1);
      }

      return {
        success: false,
        error: {
          type: error.code || error.name,
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: url,
          method: method,
          timeout: this.timeout,
          retries: retryCount
        }
      };
    }
  }
}

module.exports = new ExternalApiService();
