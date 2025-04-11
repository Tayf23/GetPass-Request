const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    // Get the path from the request
    let path = '';
    
    // Extract the path correctly
    if (event.path.includes('/api/')) {
      path = '/' + event.path.split('/api/')[1];
    } else {
      path = event.path.replace('/.netlify/functions/proxy', '');
      if (!path.startsWith('/')) path = '/' + path;
    }
    
    const method = event.httpMethod.toLowerCase();
    const API_ENDPOINT = 'http://13.48.71.148';
    const url = `${API_ENDPOINT}${path}`;
    
    console.log(`Proxying ${method} request to: ${url}`);
    
    // Parse the body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : undefined;
    } catch (e) {
      console.log('Error parsing body:', e);
      body = event.body;
    }
    
    // Make the request to your API - use direct binary response handling
    const response = await axios({
      method,
      url,
      data: body,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      responseType: 'arraybuffer',  // Critical for binary files
      validateStatus: () => true,
      timeout: 30000
    });
    
    console.log('Response status:', response.status);
    console.log('Response type:', response.headers['content-type']);
    
    // Check if response is binary (DOCX, PDF, ZIP)
    const contentType = response.headers['content-type'] || '';
    const isBinary = 
      contentType.includes('pdf') || 
      contentType.includes('vnd.openxmlformats') || 
      contentType.includes('zip') ||
      contentType.includes('octet-stream');
      
    // If response contains HTML, extract links to files
    if (contentType.includes('html') && response.data) {
      // This means we got the HTML response with download links
      console.log('Received HTML response, extracting file links');
      
      // Temporarily convert buffer to string to extract file URLs
      const htmlContent = Buffer.from(response.data).toString('utf-8');
      
      // Look for the first download link
      const urlRegex = /href="(\/download-getpass\/[^"]+)"/;
      const match = htmlContent.match(urlRegex);
      
      if (match && match[1]) {
        const fileUrl = `${API_ENDPOINT}${match[1]}`;
        console.log('Found file URL:', fileUrl);
        
        // Make a second request to get the actual file
        const fileResponse = await axios({
          method: 'GET',
          url: fileUrl,
          responseType: 'arraybuffer'
        });
        
        // Return the file directly
        return {
          statusCode: 200,
          headers: {
            'Content-Type': fileResponse.headers['content-type'],
            'Content-Disposition': fileResponse.headers['content-disposition'] || 'attachment; filename="getpass.docx"'
          },
          body: Buffer.from(fileResponse.data).toString('base64'),
          isBase64Encoded: true
        };
      }
    }
    
    // Return the response as is
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': response.headers['content-disposition'] || 
          (isBinary ? 'attachment; filename="getpass.docx"' : undefined)
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
        details: error.message
      })
    };
  }
};