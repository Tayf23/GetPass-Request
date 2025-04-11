const axios = require('axios');

exports.handler = async function(event, context) {
  console.log('Request path:', event.path);
  console.log('Request method:', event.httpMethod);
  
  try {
    // Get the path from the request - fix path extraction
    let path = '';
    
    // Check if we're using the /api/* redirect pattern
    if (event.path.includes('/api/')) {
      // Extract the part after /api/
      path = '/' + event.path.split('/api/')[1];
    } else if (event.path.includes('/.netlify/functions/proxy/')) {
      // Extract the part after proxy/
      path = '/' + event.path.split('/.netlify/functions/proxy/')[1];
    } else {
      // Fallback
      path = event.path.replace('/.netlify/functions/proxy', '');
      if (!path.startsWith('/')) path = '/' + path;
    }
    
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
    
    console.log('Sending with body:', body);
    
    // Make the request to your API
    const response = await axios({
      method,
      url,
      data: body,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      responseType: 'arraybuffer',  // Important for binary responses
      validateStatus: () => true,   // Don't throw on error status codes
      timeout: 30000                // 30 second timeout
    });
    
    console.log('Response status:', response.status);
    console.log('Response type:', response.headers['content-type']);
    
    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers['content-type'] || 'application/json',
        'Content-Disposition': response.headers['content-disposition'] || '',
      },
      body: Buffer.from(response.data).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.log('Proxy error:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'An error occurred connecting to the API',
        details: error.message,
        path: event.path,
        method: event.httpMethod
      })
    };
  }
};