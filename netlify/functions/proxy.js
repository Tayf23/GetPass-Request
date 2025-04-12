// const axios = require('axios');

// exports.handler = async function(event, context) {
//   console.log('Request path:', event.path);
//   console.log('Request method:', event.httpMethod);

//   try {
//     // Get the path from the request
//     let path = '';
    
//     // Handle the path extraction
//     if (event.path.includes('/api/')) {
//       path = event.path.replace('/api', '');
//     } else {
//       path = event.path.replace('/.netlify/functions/proxy', '');
//     }

//     const method = event.httpMethod.toLowerCase();
    
//     // Use HTTP instead of HTTPS for AWS server without SSL
//     const API_ENDPOINT = 'http://13.48.71.148';
//     const url = `${API_ENDPOINT}${path}`;
    
//     console.log(`Proxying ${method} request to: ${url}`);
    
//     // Log request details for debugging
//     console.log('Request headers:', event.headers);
    
//     // Handle request body
//     let body;
//     if (event.body) {
//       try {
//         body = JSON.parse(event.body);
//         console.log('Parsed body:', body);
//       } catch (e) {
//         console.log('Error parsing body:', e);
//         body = event.body;
//       }
//     }
    
//     // Make the request to your API
//     const response = await axios({
//       method,
//       url,
//       data: body,
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': '*/*'
//       },
//       validateStatus: () => true, // Accept all status codes
//       timeout: 60000, // Increased timeout to 60 seconds
//       // Always use arraybuffer for binary response types to ensure proper handling
//       responseType: path.includes('/download-file/') || path.includes('/generate-getpass/') ? 'arraybuffer' : 'json',
//     });
    
//     console.log('Response status:', response.status);
//     console.log('Response headers:', response.headers);
    
//     // Detect content type to determine if it's a binary file or JSON
//     const contentType = response.headers['content-type'] || '';
//     const contentDisposition = response.headers['content-disposition'] || '';
    
//     // For binary file responses
//     if (contentType.includes('application/vnd.openxmlformats') || 
//         contentType.includes('application/octet-stream') || 
//         contentType.includes('application/pdf')) {
        
//       // Extract filename from Content-Disposition header if available
//       let filename = 'document.docx';
//       const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
//       if (filenameMatch && filenameMatch[1]) {
//         filename = filenameMatch[1];
//       } else if (path.includes('generate-getpass')) {
//         // If generating a getpass document and no filename is provided, create one with date
//         const today = new Date();
//         const dateStr = today.toISOString().split('T')[0];
//         filename = `getpass_${dateStr}.docx`;
//       }
      
//       console.log('Returning binary file with filename:', filename);
      
//       return {
//         statusCode: response.status,
//         headers: {
//           'Content-Type': contentType,
//           'Content-Disposition': `attachment; filename="${filename}"`,
//         },
//         body: Buffer.from(response.data).toString('base64'),
//         isBase64Encoded: true
//       };
//     }
    
//     // Check if the response might be JSON but was received as arraybuffer
//     if ((contentType.includes('application/json') || path.includes('/generate-getpass/')) && 
//          response.data instanceof ArrayBuffer) {
//       try {
//         // Try to convert arraybuffer to JSON
//         const jsonStr = Buffer.from(response.data).toString('utf8');
//         const jsonData = JSON.parse(jsonStr);
        
//         console.log('Successfully parsed JSON from arraybuffer:', jsonData);
        
//         return {
//           statusCode: response.status,
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(jsonData)
//         };
//       } catch (e) {
//         console.log('Error parsing JSON from arraybuffer, treating as binary:', e);
        
//         // If parsing failed, it's likely a binary file despite the content type
//         return {
//           statusCode: response.status,
//           headers: {
//             'Content-Type': contentType || 'application/octet-stream',
//             'Content-Disposition': 'attachment; filename="getpass.docx"',
//           },
//           body: Buffer.from(response.data).toString('base64'),
//           isBase64Encoded: true
//         };
//       }
//     }
    
//     // Handle application/json responses that are already parsed
//     if (contentType.includes('application/json')) {
//       return {
//         statusCode: response.status,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: typeof response.data === 'object' ? 
//               JSON.stringify(response.data) : response.data
//       };
//     }
    
//     // Default case for other response types
//     return {
//       statusCode: response.status,
//       headers: {
//         'Content-Type': contentType || 'text/plain',
//       },
//       body: typeof response.data === 'object' ?
//             JSON.stringify(response.data) :
//             (typeof response.data === 'string' ? response.data : '')
//     };
    
//   } catch (error) {
//     console.log('Proxy error:', error);
    
//     // Detailed error logging
//     if (error.response) {
//       console.log('Error status:', error.response.status);
//       console.log('Error headers:', error.response.headers);
//       console.log('Error data:', error.response.data);
//     }
    
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         error: 'An error occurred connecting to the API',
//         message: error.message,
//         stack: error.stack
//       })
//     };
//   }
// };


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
    
    // Use HTTP instead of HTTPS
    const API_ENDPOINT = 'http://13.48.71.148';
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
      // Use appropriate response type based on path
      responseType: path.includes('/download-file/') ? 'arraybuffer' : 'json'
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
          'Content-Disposition': response.headers['content-disposition'] || 'attachment; filename="document.docx"',
        },
        body: Buffer.from(response.data).toString('base64'),
        isBase64Encoded: true
      };
    }
    
    // For JSON responses
    if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
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