const axios = require('axios');

exports.handler = async function(event, context) {
  console.log('Request path:', event.path);
  console.log('Request method:', event.httpMethod);
  
  try {
    // Get the path from the request
    let path = '';
    
    // Handle the path extraction
    if (event.path.includes('/api/')) {
      path = event.path.replace('/api', '');
    } else {
      path = event.path.replace('/.netlify/functions/proxy', '');
    }
    
    const method = event.httpMethod.toLowerCase();
    
    // Use port 443 (HTTPS) instead of 8000
    const API_ENDPOINT = 'https://13.48.71.148';
    const url = `${API_ENDPOINT}${path}`;
    
    console.log(`Proxying ${method} request to: ${url}`);
    
    // Log request details for debugging
    console.log('Request headers:', event.headers);
    
    // Handle request body
    let body;
    if (event.body) {
      try {
        body = JSON.parse(event.body);
        console.log('Parsed body:', body);
      } catch (e) {
        console.log('Error parsing body:', e);
        body = event.body;
      }
    }
    
    // Make the request to your API
    const response = await axios({
      method,
      url,
      data: body,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      validateStatus: () => true, // Accept all status codes
      timeout: 60000, // Increased timeout to 60 seconds
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // For binary file responses
    if (response.headers['content-type'] && (
      response.headers['content-type'].includes('application/vnd.openxmlformats') ||
      response.headers['content-type'].includes('application/octet-stream') ||
      response.headers['content-type'].includes('application/pdf')
    )) {
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': response.headers['content-type'],
          'Content-Disposition': response.headers['content-disposition'] || 'attachment',
        },
        body: Buffer.from(response.data).toString('base64'),
        isBase64Encoded: true
      };
    }
    
    // For JSON responses
    if (response.headers['content-type'] && 
        response.headers['content-type'].includes('application/json')) {
      
      // Return the JSON as is
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
        body: typeof response.data === 'object' ? 
          JSON.stringify(response.data) : response.data
      };
    }
    
    // Default case for other response types
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers['content-type'] || 'text/plain',
      },
      body: typeof response.data === 'object' ? 
        JSON.stringify(response.data) : 
        (typeof response.data === 'string' ? response.data : '')
    };
    
  } catch (error) {
    console.log('Proxy error:', error);
    
    // Detailed error logging
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error headers:', error.response.headers);
      console.log('Error data:', error.response.data);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'An error occurred connecting to the API',
        message: error.message,
        stack: error.stack
      })
    };
  }
};