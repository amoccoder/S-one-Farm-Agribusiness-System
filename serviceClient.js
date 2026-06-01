/**
 * Service-to-Service Communication Client
 * Handles HTTP requests between microservices with retry logic and circuit breaker
 */

const http = require('http');
const https = require('https');

class ServiceClient {
  constructor() {
    this.baseUrls = {
      auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      farm: process.env.FARM_SERVICE_URL || 'http://farm-service:3002',
      crop: process.env.CROP_SERVICE_URL || 'http://crop-service:3003',
      livestock: process.env.LIVESTOCK_SERVICE_URL || 'http://livestock-service:3004',
      inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3005',
      finance: process.env.FINANCE_SERVICE_URL || 'http://finance-service:3006',
      analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3007',
    };

    this.circuitBreakers = {};
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize circuit breakers for each service
   */
  initializeCircuitBreakers() {
    Object.keys(this.baseUrls).forEach((service) => {
      this.circuitBreakers[service] = {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failures: 0,
        successCount: 0,
        lastFailureTime: null,
        threshold: 5, // Failures before opening
        timeout: 60000, // Time before attempting half-open
        successThreshold: 2, // Successes before closing
      };
    });
  }

  /**
   * Check circuit breaker state
   * @param {string} service - Service name
   */
  checkCircuitBreaker(service) {
    const breaker = this.circuitBreakers[service];

    if (breaker.state === 'CLOSED') {
      return true;
    }

    if (breaker.state === 'OPEN') {
      const timeSinceFailure = Date.now() - breaker.lastFailureTime;
      if (timeSinceFailure > breaker.timeout) {
        breaker.state = 'HALF_OPEN';
        breaker.successCount = 0;
        console.log(`[Circuit Breaker] ${service} entering HALF_OPEN state`);
        return true;
      }
      return false;
    }

    if (breaker.state === 'HALF_OPEN') {
      return true;
    }

    return false;
  }

  /**
   * Record success
   * @param {string} service - Service name
   */
  recordSuccess(service) {
    const breaker = this.circuitBreakers[service];

    if (breaker.state === 'HALF_OPEN') {
      breaker.successCount++;
      if (breaker.successCount >= breaker.successThreshold) {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        console.log(`[Circuit Breaker] ${service} closed`);
      }
    } else if (breaker.state === 'CLOSED') {
      breaker.failures = 0;
    }
  }

  /**
   * Record failure
   * @param {string} service - Service name
   */
  recordFailure(service) {
    const breaker = this.circuitBreakers[service];
    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= breaker.threshold) {
      breaker.state = 'OPEN';
      console.log(`[Circuit Breaker] ${service} opened after ${breaker.failures} failures`);
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} service - Service name
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {object} data - Request body
   * @param {object} headers - Request headers
   * @param {number} retries - Number of retries
   */
  async request(service, method, path, data = null, headers = {}, retries = 3) {
    // Check circuit breaker
    if (!this.checkCircuitBreaker(service)) {
      throw new Error(`Service ${service} is unavailable (circuit breaker open)`);
    }

    const baseUrl = this.baseUrls[service];
    if (!baseUrl) {
      throw new Error(`Unknown service: ${service}`);
    }

    const url = new URL(path, baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 10000, // 10 second timeout
    };

    return new Promise((resolve, reject) => {
      const makeRequest = () => {
        const req = client.request(url, options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(responseData);
              this.recordSuccess(service);
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data: parsed,
              });
            } catch (error) {
              this.recordSuccess(service);
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data: responseData,
              });
            }
          });
        });

        req.on('error', (error) => {
          this.recordFailure(service);

          if (retries > 0) {
            console.log(`[Service Client] Retrying ${service} (${retries} retries left)`);
            setTimeout(() => {
              makeRequest();
            }, 1000);
            retries--;
          } else {
            reject(error);
          }
        });

        req.on('timeout', () => {
          this.recordFailure(service);
          req.destroy();

          if (retries > 0) {
            console.log(`[Service Client] Timeout, retrying ${service} (${retries} retries left)`);
            setTimeout(() => {
              makeRequest();
            }, 1000);
            retries--;
          } else {
            reject(new Error(`Request to ${service} timed out`));
          }
        });

        if (data) {
          req.write(JSON.stringify(data));
        }

        req.end();
      };

      makeRequest();
    });
  }

  /**
   * GET request
   */
  async get(service, path, headers = {}) {
    return this.request(service, 'GET', path, null, headers);
  }

  /**
   * POST request
   */
  async post(service, path, data, headers = {}) {
    return this.request(service, 'POST', path, data, headers);
  }

  /**
   * PUT request
   */
  async put(service, path, data, headers = {}) {
    return this.request(service, 'PUT', path, data, headers);
  }

  /**
   * DELETE request
   */
  async delete(service, path, headers = {}) {
    return this.request(service, 'DELETE', path, null, headers);
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    const status = {};
    Object.entries(this.circuitBreakers).forEach(([service, breaker]) => {
      status[service] = {
        state: breaker.state,
        failures: breaker.failures,
        lastFailureTime: breaker.lastFailureTime,
      };
    });
    return status;
  }
}

// Export singleton instance
module.exports = new ServiceClient();
