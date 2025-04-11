const axios = require('axios');

exports.handler = async function(event, context) {
  console.log('Request path:', event.path);
  console.log('Request method:', event.httpMethod);
  console.log('Request body:', event.body);
  
  try {
    // Get the path and HTTP method from the request
    const path = event.path.replace('/.netlify/functions/proxy', '');
    const method = event.httpMethod.toLowerCase();
    
    // Get the API endpoint
    const API_ENDPOINT = 'http://13.48.71.148';
    const url = `${API_ENDPOINT}${path}`;
    
    console.log('Proxying request to:', url);
    
    // Get request body if any
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : undefined;
    } catch (e) {
      console.log('Error parsing body:', e);
      body = event.body;
    }
    
    // Make the request to your API
    console.log('Sending with body:', body);
    const response = await axios({
      method,
      url,
      data: body,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      validateStatus: () => true, // Don't throw on error status codes
      timeout: 30000 // 30 second timeout
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Handle different response types
    let responseBody;
    let isBase64 = false;
    
    if (response.headers['content-type'] && 
        (response.headers['content-type'].includes('application/pdf') || 
         response.headers['content-type'].includes('application/vnd.openxmlformats') ||
         response.headers['content-type'].includes('application/octet-stream'))) {
      // Binary data like PDF or DOCX
      responseBody = Buffer.from(response.data).toString('base64');
      isBase64 = true;
    } else {
      // JSON or text
      responseBody = typeof response.data === 'object' ? 
        JSON.stringify(response.data) : response.data.toString();
    }
    
    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers['content-type'] || 'application/json',
        'Content-Disposition': response.headers['content-disposition'] || '',
        'Access-Control-Allow-Origin': '*'
      },
      body: responseBody,
      isBase64Encoded: isBase64
    };
  } catch (error) {
    console.log('Proxy error:', error.message);
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error headers:', error.response.headers);
      console.log('Error data:', error.response.data);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'An error occurred connecting to the API',
        details: error.message,
        stack: error.stack
      })
    };
  }
};