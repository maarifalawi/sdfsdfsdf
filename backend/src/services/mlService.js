const axios = require('axios');

const mlEndpoint = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function sendToMlService(imagePath) {
  const formData = new (require('form-data'))();
  const fs = require('fs');
  formData.append('image', fs.createReadStream(imagePath));

  try {
    const response = await axios.post(`${mlEndpoint}/predict`, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 60000,
    });

    return response.data;
  } catch (error) {
    console.error('Error calling ML Service:', error.message);
    throw new Error(`ML Service error: ${error.message}`);
  }
}

async function generateHeatmap(imagePath) {
  const formData = new (require('form-data'))();
  const fs = require('fs');
  formData.append('image', fs.createReadStream(imagePath));

  try {
    const response = await axios.post(`${mlEndpoint}/generate-heatmap`, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 120000,
    });

    return response.data;
  } catch (error) {
    console.error('Error generating heatmap from ML Service:', error.message);
    throw new Error(`ML Service heatmap error: ${error.message}`);
  }
}

module.exports = { sendToMlService, generateHeatmap };