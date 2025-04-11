const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    // Get the path and HTTP method from the request
    const path = event.path.replace('/.netlify/functions/proxy', '');
    const method = event.httpMethod.toLowerCase();
    
    // Get the API endpoint
    const API_ENDPOINT = 'http://13.48.71.148:8000';
    const url = `${API_ENDPOINT}${path}`;
    
    // Get request body if any
    const body = event.body ? JSON.parse(event.body) : undefined;
    
    // Make the request to your API
    const response = await axios({
      method,
      url,
      data: body,
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer' // Important for binary responses
    });
    
    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers['content-type'],
        'Content-Disposition': response.headers['content-disposition'] || '',
      },
      body: Buffer.from(response.data).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ 
        error: 'An error occurred connecting to the API',
        details: error.message
      })
    };
  }
};