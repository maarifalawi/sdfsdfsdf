#!/usr/bin/env node

/**
 * Test script to diagnose training feature issues
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TOKEN = process.env.TEST_TOKEN || 'test-token';

async function testMLServiceTraining() {
  console.log('\n=== Testing ML Service /train endpoint ===');
  console.log(`ML Service URL: ${ML_SERVICE_URL}`);
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${ML_SERVICE_URL}/train`, {}, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const duration = Date.now() - startTime;
    
    console.log(`✓ Response received in ${duration}ms`);
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, response.headers);
    console.log(`Data:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (err) {
    console.error('✗ ML Service Error');
    console.error(`Status: ${err.response?.status}`);
    console.error(`Status Text: ${err.response?.statusText}`);
    console.error(`Data:`, err.response?.data);
    console.error(`Message: ${err.message}`);
    
    if (err.code) console.error(`Code: ${err.code}`);
    if (err.cause) console.error(`Cause:`, err.cause);
    
    return null;
  }
}

async function testMLServiceTrainingStatus() {
  console.log('\n=== Testing ML Service /training-status endpoint ===');
  
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/training-status`);
    console.log(`✓ Status response:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (err) {
    console.error('✗ Status Error:', err.message);
    return null;
  }
}

async function testBackendTraining() {
  console.log('\n=== Testing Backend /admin/train endpoint ===');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Token: ${TOKEN}`);
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${BACKEND_URL}/api/admin/train`, {}, {
      timeout: 120000,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const duration = Date.now() - startTime;
    
    console.log(`✓ Response received in ${duration}ms`);
    console.log(`Status: ${response.status}`);
    console.log(`Data:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (err) {
    console.error('✗ Backend Error');
    console.error(`Status: ${err.response?.status}`);
    console.error(`Status Text: ${err.response?.statusText}`);
    console.error(`Data:`, err.response?.data);
    console.error(`Message: ${err.message}`);
    
    if (err.code) console.error(`Code: ${err.code}`);
    
    return null;
  }
}

async function main() {
  console.log('Starting Training Diagnostic Test');
  console.log('================================');
  
  // First check if services are running
  console.log('\n=== Checking service availability ===');
  
  try {
    await axios.get(`${ML_SERVICE_URL}/docs`, { timeout: 5000 });
    console.log('✓ ML Service is running');
  } catch (err) {
    console.error('✗ ML Service is NOT running or not accessible');
    console.error(`  Error: ${err.message}`);
  }
  
  try {
    await axios.get(`${BACKEND_URL}/api/admin/dashboard`, {
      timeout: 5000,
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    console.log('✓ Backend is running');
  } catch (err) {
    console.error('✗ Backend is NOT running or not accessible');
    console.error(`  Error: ${err.message}`);
  }
  
  // Test ML Service directly first
  const mlResult = await testMLServiceTraining();
  
  // Check training status
  await testMLServiceTrainingStatus();
  
  // Then test through backend proxy
  const backendResult = await testBackendTraining();
  
  console.log('\n=== Test Summary ===');
  if (mlResult && backendResult) {
    console.log('✓ All tests passed');
  } else {
    console.log('✗ Some tests failed - see details above');
  }
}

main().catch(console.error);
