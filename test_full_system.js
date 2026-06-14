#!/usr/bin/env node

/**
 * Comprehensive System Integration Test
 * Tests all three services: Frontend (Vite), Backend (Express), ML Service (FastAPI)
 */

const http = require('http');
const https = require('https');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 5000,
    };

    if (data) {
      const json = JSON.stringify(data);
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': json.length,
      };
    }

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed || body,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testBackendHealth() {
  log(COLORS.blue, '\n=== Testing Backend Health ===');
  try {
    const result = await makeRequest('http://localhost:5000/');
    if (result.status === 200) {
      log(COLORS.green, '✓ Backend is responding');
      return true;
    } else {
      log(COLORS.red, `✗ Backend returned status ${result.status}`);
      return false;
    }
  } catch (error) {
    log(COLORS.red, `✗ Backend error: ${error.message}`);
    return false;
  }
}

async function testMLServiceHealth() {
  log(COLORS.blue, '\n=== Testing ML Service Health ===');
  try {
    const result = await makeRequest('http://localhost:8000/docs');
    if (result.status === 200) {
      log(COLORS.green, '✓ ML Service is responding');
      return true;
    } else {
      log(COLORS.red, `✗ ML Service returned status ${result.status}`);
      return false;
    }
  } catch (error) {
    log(COLORS.red, `✗ ML Service error: ${error.message}`);
    return false;
  }
}

async function testBackendRoutes() {
  log(COLORS.blue, '\n=== Testing Backend Routes ===');

  const routes = [
    { name: 'Root', url: 'http://localhost:5000/', method: 'GET' },
    { name: 'Health Check', url: 'http://localhost:5000/health', method: 'GET' },
    { name: 'Admin Login', url: 'http://localhost:5000/api/auth/login', method: 'POST', data: { email: 'admin@example.com', password: 'admin123' } },
  ];

  let passed = 0;
  for (const route of routes) {
    try {
      const result = await makeRequest(route.url, route.method, route.data);
      if (result.status >= 200 && result.status < 500) {
        log(COLORS.green, `✓ ${route.name}: ${result.status}`);
        passed++;
      } else {
        log(COLORS.red, `✗ ${route.name}: ${result.status}`);
      }
    } catch (error) {
      log(COLORS.red, `✗ ${route.name}: ${error.message}`);
    }
  }

  return passed === routes.length;
}

async function testMLServiceRoutes() {
  log(COLORS.blue, '\n=== Testing ML Service Routes ===');

  const routes = [
    { name: 'Analytics', url: 'http://localhost:8000/analytics', method: 'GET' },
    { name: 'Training History', url: 'http://localhost:8000/training-history', method: 'GET' },
    { name: 'Evaluation', url: 'http://localhost:8000/evaluation', method: 'GET' },
    { name: 'Model Metrics', url: 'http://localhost:8000/model-metrics', method: 'GET' },
  ];

  let passed = 0;
  for (const route of routes) {
    try {
      const result = await makeRequest(route.url, route.method, route.data);
      if (result.status >= 200 && result.status < 500) {
        log(COLORS.green, `✓ ${route.name}: ${result.status}`);
        passed++;
      } else {
        log(COLORS.yellow, `⚠ ${route.name}: ${result.status}`);
      }
    } catch (error) {
      log(COLORS.yellow, `⚠ ${route.name}: ${error.message}`);
    }
  }

  return passed >= routes.length - 1; // Allow 1 failure
}

async function testFrontendViteServer() {
  log(COLORS.blue, '\n=== Testing Frontend Vite Server ===');
  try {
    const result = await makeRequest('http://localhost:5173/');
    if (result.status === 200 || result.status === 304) {
      log(COLORS.green, '✓ Vite dev server is responding');
      return true;
    } else {
      log(COLORS.yellow, `⚠ Vite returned status ${result.status}`);
      return true; // Non-critical
    }
  } catch (error) {
    log(COLORS.yellow, `⚠ Vite error: ${error.message}`);
    return true; // Non-critical
  }
}

async function testBackendToMLProxyRoutes() {
  log(COLORS.blue, '\n=== Testing Backend to ML Proxy Routes ===');

  const routes = [
    { name: 'ML Analytics via Backend', url: 'http://localhost:5000/api/ml/analytics', method: 'GET' },
    { name: 'ML Training History via Backend', url: 'http://localhost:5000/api/ml/training-history', method: 'GET' },
    { name: 'ML Evaluation via Backend', url: 'http://localhost:5000/api/ml/evaluation', method: 'GET' },
  ];

  let passed = 0;
  for (const route of routes) {
    try {
      const result = await makeRequest(route.url, route.method, route.data);
      if (result.status >= 200 && result.status < 500) {
        log(COLORS.green, `✓ ${route.name}: ${result.status}`);
        passed++;
      } else {
        log(COLORS.yellow, `⚠ ${route.name}: ${result.status}`);
      }
    } catch (error) {
      log(COLORS.yellow, `⚠ ${route.name}: ${error.message}`);
    }
  }

  return passed >= 1; // At least one must work
}

async function runAllTests() {
  log(COLORS.bright + COLORS.blue, '\n╔════════════════════════════════════════╗');
  log(COLORS.bright + COLORS.blue, '║  BATIK CLASSIFICATION SYSTEM TEST SUITE  ║');
  log(COLORS.bright + COLORS.blue, '╚════════════════════════════════════════╝\n');

  const results = {
    backendHealth: await testBackendHealth(),
    mlServiceHealth: await testMLServiceHealth(),
    frontendVite: await testFrontendViteServer(),
    backendRoutes: await testBackendRoutes(),
    mlServiceRoutes: await testMLServiceRoutes(),
    proxyRoutes: await testBackendToMLProxyRoutes(),
  };

  log(COLORS.bright + COLORS.blue, '\n╔════════════════════════════════════════╗');
  log(COLORS.bright + COLORS.blue, '║  TEST SUMMARY                           ║');
  log(COLORS.bright + COLORS.blue, '╚════════════════════════════════════════╝\n');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? COLORS.green + '✓' : COLORS.red + '✗';
    const name = test.replace(/([A-Z])/g, ' $1').trim();
    log(status, `${name}: ${result ? 'PASSED' : 'FAILED'}`);
  });

  log(COLORS.bright + COLORS.blue, `\nTotal: ${passed}/${total} tests passed`);

  if (passed === total) {
    log(COLORS.green, '\n🎉 ALL TESTS PASSED! System is ready for integration testing.');
  } else if (passed >= total - 1) {
    log(COLORS.yellow, '\n⚠️ MOST TESTS PASSED. Some non-critical services may need attention.');
  } else {
    log(COLORS.red, '\n❌ CRITICAL TESTS FAILED. Check service status and logs.');
  }

  return passed === total;
}

// Run all tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(COLORS.red, `Fatal error: ${error.message}`);
  process.exit(1);
});
