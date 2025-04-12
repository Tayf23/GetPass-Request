const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    // Get the path from the request
    let path = '';
    if (event.path.includes('/api/')) {
      path = '/' + event.path.split('/api/')[1];
    } else {
      path = event.path.replace('/.netlify/functions/proxy', '');
      if (!path.startsWith('/')) path = '/' + path;
    }
    
    const method = event.httpMethod.toLowerCase();
    const API_ENDPOINT = 'http://13.48.71.148:8000';
    const url = `${API_ENDPOINT}${path}`;
    
    console.log(`Proxying ${method} request to: ${url}`);
    
    // Parse the body for POST requests
    let body;
    if (method === 'post' && event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        console.log('Error parsing body:', e);
        body = event.body;
      }
    }
    
    // Set proper response type based on path
    const isDownloadRequest = path.includes('/download-file/');
    const responseType = isDownloadRequest ? 'arraybuffer' : 'json';
    
    // Make the request to your API
    const response = await axios({
      method,
      url,
      data: body,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      responseType,
      validateStatus: () => true,
      timeout: 30000
    });
    
    console.log('Response status:', response.status);
    console.log('Response type:', response.headers['content-type']);
    
    // For binary file responses
    if (responseType === 'arraybuffer' || 
        (response.headers['content-type'] && (
         response.headers['content-type'].includes('application/pdf') || 
         response.headers['content-type'].includes('application/vnd.openxmlformats') ||
         response.headers['content-type'].includes('application/octet-stream')))) {
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': response.headers['content-type'],
          'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
          'Access-Control-Allow-Origin': '*'
        },
        body: Buffer.from(response.data).toString('base64'),
        isBase64Encoded: true
      };
    }
    
    // For JSON responses
    if (response.data && typeof response.data === 'object') {
      // Update file URLs to use the proxy
      if (response.data.files && Array.isArray(response.data.files)) {
        response.data.files = response.data.files.map(file => ({
          ...file,
          url: `/api${file.url}`
        }));
      }
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(response.data)
      };
    }
    
    // Fallback for other response types
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers['content-type'] || 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
      body: typeof response.data === 'string' ? 
        response.data : 
        JSON.stringify(response.data)
    };
    
  } catch (error) {
    console.log('Proxy error:', error.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'An error occurred connecting to the API',
        details: error.message
      })
    };
  }
};