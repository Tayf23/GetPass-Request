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
  
  // Function to check if text contains only Arabic characters
  const isArabicOnly = (text) => {
    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    return arabicPattern.test(text);
  };
  
  // Get selected dates from localStorage (set by EnterDate component)
  const getSelectedDates = () => {
    const datesFromStorage = localStorage.getItem('selectedDates');
    if (datesFromStorage) {
      return JSON.parse(datesFromStorage);
    }
    return [];
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

  // Handle form submission
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
      
      // Send data to backend
      // const response = await axios.post('http://13.48.71.148:8000/generate-getpass/', apiData, {
      //   // const response = await axios.post('http://localhost:8000/generate-getpass/', apiData, {
      //   responseType: 'blob' // Important for receiving binary data

      // });

      const API_URL = 'http://13.48.71.148:8000/generate-getpass/';
      const CORS_PROXY = 'https://corsproxy.io/?';

      const response = await axios.post(CORS_PROXY + encodeURIComponent(API_URL), apiData, {
        responseType: 'blob'
      });
      
      // Determine file type and name based on Content-Type header
      const contentType = response.headers['content-type'];
      let fileName;
      
      if (contentType === 'application/pdf') {
        fileName = 'getpass.pdf';
        setSuccessMessage("PDF generated successfully!");
      } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileName = 'getpass.docx';
        setSuccessMessage("Word document generated successfully! (PDF conversion was not available)");
      } else if (contentType === 'application/zip') {
        fileName = 'getpass_documents.zip';
        setSuccessMessage("ZIP file with Word documents generated successfully! (PDF conversion was not available)");
      } else {
        fileName = 'getpass_document';
        setSuccessMessage("Document generated successfully!");
      }
      
      // Download the file
      downloadFile(response.data, fileName);
      
    } catch (error) {
      console.error("Error submitting the form:", error);
      setError("An error occurred while processing your request. Please try again.");
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
        
        <EnterDate />
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading || forms.some((_, index) => 
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