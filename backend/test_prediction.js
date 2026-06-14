// Simple test script to verify the prediction flow
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testPrediction() {
  console.log('🧪 Testing prediction flow...\n');

  // Test 1: Check if ML Service is running
  console.log('📡 Test 1: Checking ML Service health...');
  try {
    const healthResponse = await axios.get('http://localhost:8000/health');
    console.log('✅ ML Service is running:', healthResponse.data);
  } catch (error) {
    console.error('❌ ML Service error:', error.message);
    return;
  }

  // Test 2: Check if Backend is running
  console.log('\n📡 Test 2: Checking Backend...');
  try {
    const backendResponse = await axios.get('http://localhost:5000/api/datasets');
    console.log('✅ Backend is running');
  } catch (error) {
    console.error('❌ Backend error:', error.message);
    return;
  }

  // Test 3: Get history
  console.log('\n📡 Test 3: Fetching prediction history...');
  try {
    const historyResponse = await axios.get('http://localhost:5000/api/predictions/history');
    console.log('✅ History fetched:', historyResponse.data.length, 'records');
    if (historyResponse.data.length > 0) {
      console.log('First record:', historyResponse.data[0]);
    }
  } catch (error) {
    console.error('❌ History error:', error.message);
  }

  console.log('\n✨ Test complete!');
}

testPrediction().catch(console.error);
