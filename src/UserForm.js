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
      // Get dates directly from the page instead of using getSelectedDates()
      // You can either modify this to access the dates another way or define a new function
      
      // Example of directly accessing the dates if they're in your component state:
      const selectedDates = document.querySelectorAll('.lli .date-text').length > 0 
        ? Array.from(document.querySelectorAll('.lli .date-text')).map(el => {
            // Extract date in YYYY-MM-DD format from displayed dates
            const dateText = el.textContent.trim();
            const dateParts = dateText.match(/\d{2}\/\d{2}\/\d{4}/);
            if (dateParts) {
              const [day, month, year] = dateParts[0].split('/');
              return { date: `${year}-${month}-${day}` };
            }
            return null;
          }).filter(d => d !== null)
        : [];
      
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

      console.log("Dates:===========", apiData.dates)
      
// For single dates, we'll now handle them the same way as multiple dates
if (selectedDates.length === 1) {
  // First get JSON response with file URL
  const response = await axios.post('/api/generate-getpass/', apiData);
  
  // Check if response contains files array
  if (response.data && response.data.files && Array.isArray(response.data.files) && response.data.files.length > 0) {
    const file = response.data.files[0]; // Get the first (and only) file
    
    try {
      // Download the file individually as blob
      const fileResponse = await axios.get(`/api${file.url}`, {
        responseType: 'blob'
      });
      
      // Download the file with the filename from the server
      downloadFile(fileResponse.data, file.filename);
      setSuccessMessage(`Document ${file.filename} downloaded successfully.`);
    } catch (err) {
      console.error(`Error downloading ${file.filename}:`, err);
      setError(`Failed to download the document: ${err.message}`);
    }
  } else {
    // If we didn't get the expected response format, fallback to direct download
    try {
      const directResponse = await axios.post('/api/generate-getpass/', apiData, {
        responseType: 'blob'
      });
      
      // Extract the date for the filename
      const datePart = selectedDates[0].date;
      const [year, month, day] = datePart.split('-');
      const formattedDate = `${day}-${month}-${year}`;
      
      // Set filename based on content type
      const contentType = directResponse.headers['content-type'];
      let fileName;
      
      if (contentType === 'application/pdf') {
        fileName = `getpass_${formattedDate}.pdf`;
      } else {
        fileName = `getpass_${formattedDate}.docx`;
      }
      
      downloadFile(directResponse.data, fileName);
      setSuccessMessage(`Document ${fileName} downloaded successfully.`);
    } catch (err) {
      console.error("Error with direct download:", err);
      setError(`Failed to download the document: ${err.message}`);
    }
  }
}
      // For multiple dates, use JSON response type
      else {
        // First get JSON response with file URLs
        const response = await axios.post('/api/generate-getpass/', apiData);
        
        // Check if response contains files array
        if (response.data && response.data.files && Array.isArray(response.data.files)) {
          const { files } = response.data;
          
          setSuccessMessage(`${files.length} documents generated successfully. Downloads starting...`);
          
          // Download each file with a delay
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
              // Download each file individually as blob
              const fileResponse = await axios.get(`/api${file.url}`, {
                responseType: 'blob'
              });
              
              // Download the file
              downloadFile(fileResponse.data, file.filename);
              
              // If we're on the last file, show a final success message
              if (i === files.length - 1) {
                setSuccessMessage(`All ${files.length} documents downloaded successfully.`);
              }
            } catch (err) {
              console.error(`Error downloading ${file.filename}:`, err);
            }
            
            // Wait a bit between downloads to prevent browser blocking
            if (i < files.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } else {
          // Handle unexpected response format
          console.error("Unexpected response format:", response.data);
          setError("Received an invalid response from the server.");
        }
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