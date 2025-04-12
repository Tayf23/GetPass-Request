import React, { useState } from 'react';
import axios from 'axios';
import './UserForm.css';
import EnterDate from './EnterDate';

export default function UserForm() {
  // State for user forms
  const [forms, setForms] = useState([{ name: "", nationality: "", idNumber: "" }]);
  
  // State for loading indicator
  const [loading, setLoading] = useState(false);
  
  // State for error messages
  const [error, setError] = useState(null);
  
  // State for input field errors
  const [inputErrors, setInputErrors] = useState([{ name: "", nationality: "" }]);
  
  // State for success message
  const [successMessage, setSuccessMessage] = useState(null);
  
  // State for selected dates
  const [selectedDates, setSelectedDates] = useState([]);
  
  // Function to check if text contains only Arabic characters
  const isArabicOnly = (text) => {
    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    return arabicPattern.test(text);
  };
  
  // Handle date changes from EnterDate component
  const handleDatesChange = (dates) => {
    setSelectedDates(dates);
    console.log("Dates updated:", dates);
  };

  // Handle input changes
  const handleChanges = (index, e) => {
    const { name, value } = e.target;
    const newForms = [...forms];
    const newInputErrors = [...inputErrors];
    
    // For name and nationality fields, check if it's Arabic only
    if ((name === 'name' || name === 'nationality') && value !== "") {
      if (!isArabicOnly(value)) {
        newInputErrors[index] = {
          ...newInputErrors[index],
          [name]: "Please enter Arabic text only"
        };
      } else {
        newInputErrors[index] = {
          ...newInputErrors[index],
          [name]: ""
        };
      }
    } else {
      newInputErrors[index] = {
        ...newInputErrors[index],
        [name]: ""
      };
    }
    
    newForms[index] = {
      ...newForms[index],
      [name]: value,
    };
    
    setForms(newForms);
    setInputErrors(newInputErrors);
  };

  // Add new form section
  const addForm = () => {
    setForms([...forms, { name: "", nationality: "", idNumber: "" }]);
    setInputErrors([...inputErrors, { name: "", nationality: "" }]);
  };

  // Remove a form section
  const removeForm = (index) => {
    if (window.confirm("Are you sure you want to delete this visitor?")) {
      setForms(forms.filter((_, i) => i !== index));
      setInputErrors(inputErrors.filter((_, i) => i !== index));
    }
  };

  // Function to download the generated file
  const downloadFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Validate that all name and nationality inputs are in Arabic
  const validateArabicInputs = () => {
    let isValid = true;
    const newInputErrors = [...inputErrors];
    
    forms.forEach((form, index) => {
      if (!isArabicOnly(form.name) && form.name !== "") {
        newInputErrors[index].name = "Please enter Arabic text only";
        isValid = false;
      }
      
      if (!isArabicOnly(form.nationality) && form.nationality !== "") {
        newInputErrors[index].nationality = "Please enter Arabic text only";
        isValid = false;
      }
    });
    
    setInputErrors(newInputErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if all name and nationality inputs are Arabic
    if (!validateArabicInputs()) {
      setError("Please correct the errors in the form");
      return;
    }
    
    if (selectedDates.length === 0) {
      setError("Please select at least one date before submitting.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Format data for the API
      const apiData = {
        people: forms.map(form => ({
          name: form.name,
          nationality: form.nationality,
          id_number: form.idNumber
        })),
        dates: selectedDates
      };
      
      console.log("Sending API data:", apiData);

      // Make the API request
      const response = await axios.post('/api/generate-getpass/', apiData, {
        responseType: 'blob'
      });
      
      // Check if the response is a blob
      if (response.data instanceof Blob) {
        const contentType = response.headers['content-type'];
        
        // Check if we received JSON despite asking for blob (happens with multiple files)
        if (contentType === 'application/json') {
          // Convert blob to text to parse as JSON
          const jsonText = await response.data.text();
          const jsonData = JSON.parse(jsonText);
          
          if (jsonData.files && Array.isArray(jsonData.files)) {
            const { files } = jsonData;
            
            setSuccessMessage(`${files.length} documents generated successfully. Downloads starting...`);
            
            // Download each file with a delay to prevent browser blocking
            let downloadCount = 0;
            files.forEach((file, index) => {
              setTimeout(async () => {
                try {
                  // Get the file
                  const fileResponse = await axios.get(`/api${file.url}`, {
                    responseType: 'blob'
                  });
                  
                  // Download the file
                  downloadFile(fileResponse.data, file.filename);
                  
                  // Track completed downloads
                  downloadCount++;
                  
                  // Reset form after all downloads are complete
                  if (downloadCount === files.length) {
                    setForms([{ name: "", nationality: "", idNumber: "" }]);
                    setSelectedDates([]);
                  }
                } catch (err) {
                  console.error(`Error downloading ${file.filename}:`, err);
                }
              }, index * 1000); // 1 second delay between downloads
            });
          } else {
            setError("Received unexpected JSON response");
          }
        } else {
          // It's a direct file download (single file)
          let fileName;
          
          // Try to get filename from Content-Disposition header
          const disposition = response.headers['content-disposition'];
          if (disposition && disposition.includes('filename=')) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches !== null && matches[1]) {
              fileName = matches[1].replace(/['"]/g, '');
            }
          }
          
          // If no filename found in header, generate one based on content type and date
          if (!fileName) {
            const date = selectedDates[0] ? selectedDates[0].date : new Date().toISOString().split('T')[0];
            const formattedDate = date.replace(/-/g, '-');
            
            if (contentType === 'application/pdf') {
              fileName = `getpass_${formattedDate}.pdf`;
            } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              fileName = `getpass_${formattedDate}.docx`;
            } else {
              fileName = `getpass_${formattedDate}.docx`;
            }
          }
          
          // Download the file
          downloadFile(response.data, fileName);
          setSuccessMessage(`Document '${fileName}' generated successfully!`);
          
          // Reset form after successful submission
          setForms([{ name: "", nationality: "", idNumber: "" }]);
          setSelectedDates([]);
        }
      } else {
        // Handle unexpected response format
        console.error("Unexpected response format:", response);
        setError("Received an invalid response from the server.");
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      
      let errorMessage = "An error occurred while processing your request.";
      
      if (error.response) {
        errorMessage += ` Server returned: ${error.response.status}`;
        console.log("Response data:", error.response.data);
      } else if (error.request) {
        errorMessage += " No response received from server.";
      } else {
        errorMessage += ` ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="input-container">
      <h2>Enter Your GetPass Information</h2>
      <form onSubmit={handleSubmit}>
        {forms.map((form, index) => (
          <div key={index} className="form-group">
            {index > 0 && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeForm(index)}
                aria-label="Remove visitor"
              >
                ❌
              </button>
            )}
            <label>Name (Arabic only)*</label>
            <input
              type="text"
              name="name"
              placeholder="أدخل الاسم الكامل"
              value={form.name}
              onChange={(e) => handleChanges(index, e)}
              required
              dir="rtl"
            />
            {inputErrors[index].name && (
              <div className="input-error" style={{color: "red"}}>{inputErrors[index].name}</div>
            )}
            
            <label>Nationality (Arabic only)*</label>
            <input
              type="text"
              name="nationality"
              placeholder="أدخل الجنسية"
              value={form.nationality}
              onChange={(e) => handleChanges(index, e)}
              required
              dir="rtl"
            />
            {inputErrors[index].nationality && (
              <div className="input-error" style={{color: "red"}}>{inputErrors[index].nationality}</div>
            )}
            
            <label>ID Number*</label>
            <input
              type="text"
              name="idNumber"
              placeholder="ادخل رقم الهوية/ الإقامة/ الجواز"
              value={form.idNumber}
              onChange={(e) => handleChanges(index, e)}
              required
              dir="rtl"
            />
          </div>
        ))}
        
        <div className="buttons-container">
          <button 
            type="button" 
            className="add-btn" 
            onClick={addForm}
            aria-label="Add another visitor"
          >
            +
          </button>
        </div>
        
        <EnterDate onDatesChange={handleDatesChange} />
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading || 
                   selectedDates.length === 0 || 
                   forms.some((_, index) => 
                     inputErrors[index].name || inputErrors[index].nationality
                   )}
        >
          {loading ? "Processing..." : "Generate Document"}
        </button>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
      </form>
    </div>
  );
}