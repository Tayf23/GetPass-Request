const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    // Get the path from the request
    let path = '';
    if (event.path.includes('/api/')) {
      path = '/' + event.path.split('/api/')[1];
    } else if (event.path.includes('/download-file/')) {
      // For download requests, preserve the full path
      path = event.path;
    } else {
      path = event.path.replace('/.netlify/functions/proxy', '');
      if (!path.startsWith('/')) path = '/' + path;
    }
    
    const method = event.httpMethod.toLowerCase();
    const API_ENDPOINT = 'http://13.48.71.148';
    const url = `${API_ENDPOINT}${path}`;
    
    console.log(`Proxying ${method} request to: ${url}`);
    
    // Handle request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : undefined;
    } catch (e) {
      console.log('Error parsing body:', e);
      body = event.body;
    }
    
    // Set appropriate response type based on path
    const responseType = path.includes('/download-file/') ? 'arraybuffer' : 'json';
    
    // Make the request to your API
    const response = await axios({
      method,
      url,
      data: body,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      responseType: responseType,
      validateStatus: () => true,
      timeout: 30000
    });
    
    console.log('Response status:', response.status);
    console.log('Response type:', response.headers['content-type']);
    
    // For binary file responses (when downloading a file)
    if (responseType === 'arraybuffer' || 
        (response.headers['content-type'] && (
         response.headers['content-type'].includes('application/pdf') || 
         response.headers['content-type'].includes('application/vnd.openxmlformats') ||
         response.headers['content-type'].includes('application/octet-stream')))) {
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': response.headers['content-type'],
          'Content-Disposition': response.headers['content-disposition'] || 'attachment'
        },
        body: Buffer.from(response.data).toString('base64'),
        isBase64Encoded: true
      };
    }
    
    // For JSON responses (including file lists)
    if (response.headers['content-type'] && 
        response.headers['content-type'].includes('application/json')) {
      
      // Update file URLs to use the proxy
      if (response.data.files && Array.isArray(response.data.files)) {
        response.data.files = response.data.files.map(file => ({
          ...file,
          url: `/api${file.url}` // Prefix with /api to route through proxy
        }));
      }
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response.data)
      };
    }
    
    // For any other response type
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers['content-type'] || 'text/plain'
      },
      body: typeof response.data === 'object' ? 
        JSON.stringify(response.data) : 
        response.data.toString()
    };
    
  } catch (error) {
    console.log('Proxy error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'An error occurred connecting to the API',
        details: error.message
      })
    };
  }
};