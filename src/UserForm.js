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
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const selectedDates = getSelectedDates();
      
      if (selectedDates.length === 0) {
        setError("Please select at least one date before submitting.");
        setLoading(false);
        return;
      }
      
      // Format data for the API
      const apiData = {
        people: forms.map(form => ({
          name: form.name,
          nationality: form.nationality,
          id_number: form.idNumber
        })),
        dates: selectedDates.map(dateEntry => ({
          date: dateEntry.date
        }))
      };
      
      // First make a request to check if we'll get one file or multiple files
      const checkResponse = await axios.post('/api/generate-getpass/', apiData);
      
      // If the response is JSON with files array, handle multiple files
      if (checkResponse.data && checkResponse.data.files && Array.isArray(checkResponse.data.files)) {
        const { files } = checkResponse.data;
        
        setSuccessMessage(`${files.length} documents generated successfully. Downloads starting...`);
        
        // Download each file with a delay to prevent browser blocking
        files.forEach((file, index) => {
          setTimeout(async () => {
            try {
              // Get the file with responseType blob
              const fileResponse = await axios.get(`/api${file.url}`, {
                responseType: 'blob'
              });
              
              // Download the file
              downloadFile(fileResponse.data, file.filename);
              
              // If this is the last file, clear the dates
              if (index === files.length - 1) {
                clearSelectedDates();
                setForms([{ name: "", nationality: "", idNumber: "" }]);
              }
            } catch (err) {
              console.error(`Error downloading ${file.filename}:`, err);
            }
          }, index * 1000); // 1 second delay between downloads
        });
      } else {
        // For single file, make a new request with responseType: 'blob'
        const response = await axios.post('/api/generate-getpass/', apiData, {
          responseType: 'blob'
        });
        
        // Get filename from the response headers if available
        let fileName = 'getpass.docx';
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }
        
        // If no filename found in header, use the date
        if (fileName === 'getpass.docx' && selectedDates.length > 0) {
          const dateStr = selectedDates[0].date.replace(/-/g, '-');
          fileName = `getpass_${dateStr}.docx`;
        }
        
        // Download the file
        downloadFile(response.data, fileName);
        setSuccessMessage(`Document generated successfully!`);
        
        // Clear selected dates after successful download
        clearSelectedDates();
        setForms([{ name: "", nationality: "", idNumber: "" }]);
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