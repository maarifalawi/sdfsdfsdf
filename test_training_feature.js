/**
 * Training Feature - Automated Test
 * Tests the complete training flow from frontend to ML service
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';
const ML_SERVICE_URL = 'http://localhost:8000';
const TEST_TIMEOUT = 600000; // 10 minutes

class TrainingTester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      details: []
    };
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type}: ${message}`);
    this.results.details.push({ type, message, timestamp });
  }

  async testEndpoint(name, url, method = 'GET', data = null) {
    try {
      this.log('TEST', `Testing ${method} ${url}`);
      let response;
      if (method === 'POST') {
        response = await axios.post(url, data, { timeout: TEST_TIMEOUT });
      } else {
        response = await axios.get(url, { timeout: TEST_TIMEOUT });
      }
      this.log('PASS', `${name} returned status ${response.status}`);
      this.results.passed.push(name);
      return response.data;
    } catch (error) {
      this.log('FAIL', `${name} failed: ${error.message}`);
      this.results.failed.push(name);
      return null;
    }
  }

  async runTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 BATIK TRAINING FEATURE - AUTOMATED TEST SUITE');
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Test Backend Health
    console.log('\n📋 1. BACKEND HEALTH CHECK');
    console.log('─────────────────────────────');
    await this.testEndpoint('Backend Health', `${BACKEND_URL}/`);

    // 2. Test ML Service Health
    console.log('\n📋 2. ML SERVICE HEALTH CHECK');
    console.log('─────────────────────────────');
    await this.testEndpoint('ML Service Health', `${ML_SERVICE_URL}/docs`, 'GET');

    // 3. Test ML Service Status Endpoints
    console.log('\n📋 3. ML SERVICE STATUS ENDPOINTS');
    console.log('─────────────────────────────');
    await this.testEndpoint('ML Training Status', `${ML_SERVICE_URL}/training-status`);
    await this.testEndpoint('ML Training History', `${ML_SERVICE_URL}/training-history`);
    await this.testEndpoint('ML Model Metrics', `${ML_SERVICE_URL}/model-metrics`);
    await this.testEndpoint('ML Analytics', `${ML_SERVICE_URL}/analytics`);

    // 4. Test Backend Proxy Routes
    console.log('\n📋 4. BACKEND PROXY ROUTES');
    console.log('─────────────────────────────');
    await this.testEndpoint('Backend Training Status Proxy', `${BACKEND_URL}/api/ml/training-status`);
    await this.testEndpoint('Backend Training History Proxy', `${BACKEND_URL}/api/ml/training-history`);
    await this.testEndpoint('Backend Model Metrics Proxy', `${BACKEND_URL}/api/ml/model-metrics`);
    await this.testEndpoint('Backend Analytics Proxy', `${BACKEND_URL}/api/ml/analytics`);

    // 5. Test Admin Dashboard
    console.log('\n📋 5. ADMIN DASHBOARD ENDPOINT');
    console.log('─────────────────────────────');
    await this.testEndpoint('Admin Dashboard', `${BACKEND_URL}/api/admin/dashboard`);

    // 6. Start Training
    console.log('\n📋 6. TRIGGER TRAINING (This will take 1-2 minutes)');
    console.log('─────────────────────────────');
    const startTime = Date.now();
    this.log('INFO', 'Starting training request...');
    const trainResponse = await this.testEndpoint('Start Training', `${BACKEND_URL}/api/admin/train`, 'POST', {});
    
    if (trainResponse) {
      this.log('INFO', `Training response: ${JSON.stringify(trainResponse)}`);

      // 7. Poll Training Status
      console.log('\n📋 7. POLLING TRAINING STATUS');
      console.log('─────────────────────────────');
      let completed = false;
      let pollCount = 0;
      const pollInterval = 5000; // 5 seconds
      const maxPolls = 120; // 10 minutes

      while (!completed && pollCount < maxPolls) {
        await new Promise(r => setTimeout(r, pollInterval));
        pollCount++;

        try {
          const statusResponse = await axios.get(`${BACKEND_URL}/api/ml/training-status`);
          const status = statusResponse.data;
          
          this.log('POLL', `Status: ${status.state}, Progress: ${status.progress}%, Log: ${status.log}`);

          if (status.state === 'completed' || status.state === 'error') {
            completed = true;
            if (status.state === 'completed') {
              this.log('PASS', 'Training completed successfully!');
            } else {
              this.log('FAIL', `Training failed with state: ${status.state}`);
            }
          }
        } catch (error) {
          this.log('WARN', `Poll failed: ${error.message}`);
        }
      }

      if (!completed) {
        this.log('WARN', 'Training polling timed out after 10 minutes');
      }
    }

    // 8. Verify Output Files
    console.log('\n📋 8. VERIFY OUTPUT FILES');
    console.log('─────────────────────────────');
    const fs = require('fs');
    const path = require('path');
    const ML_DIR = path.join(__dirname, '..', '..', 'ml_service');

    const requiredFiles = [
      'model.h5',
      'labels.json',
      'metrics.json',
      'training_history.json'
    ];

    for (const file of requiredFiles) {
      const filepath = path.join(ML_DIR, file);
      if (fs.existsSync(filepath)) {
        const stat = fs.statSync(filepath);
        this.log('PASS', `File ${file} exists (${(stat.size / 1024).toFixed(1)} KB)`);
        this.results.passed.push(`File: ${file}`);
      } else {
        this.log('FAIL', `File ${file} does not exist`);
        this.results.failed.push(`File: ${file}`);
      }
    }

    // 9. Final Report
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`📝 Total: ${this.results.passed.length + this.results.failed.length}`);

    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.failed.forEach(test => console.log(`  - ${test}`));
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    return this.results;
  }
}

// Run tests
const tester = new TrainingTester();
tester.runTests().then(results => {
  const exitCode = results.failed.length === 0 ? 0 : 1;
  process.exit(exitCode);
}).catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
