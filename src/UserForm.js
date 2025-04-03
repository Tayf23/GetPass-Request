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
  
  // State for success message
  const [successMessage, setSuccessMessage] = useState(null);
  
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
    
    newForms[index] = {
      ...newForms[index],
      [name]: value,
    };
    
    setForms(newForms);
  };

  // Add new form section
  const addForm = () => {
    setForms([...forms, { name: "", nationality: "", idNumber: "" }]);
  };

  // Remove a form section
  const removeForm = (index) => {
    if (window.confirm("Are you sure you want to delete this form?")) {
      setForms(forms.filter((_, i) => i !== index));
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const response = await axios.post('http://localhost:8000/generate-getpass/', apiData, {
        responseType: 'blob' // Important for receiving binary data
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
              >
                ❌
              </button>
            )}
            <label>Name*</label>
            <input
              type="text"
              name="name"
              placeholder="Enter Full Name"
              value={form.name}
              onChange={(e) => handleChanges(index, e)}
              required
              dir="rtl"
            />
            
            <label>Nationality*</label>
            <input
              type="text"
              name="nationality"
              placeholder="Enter Nationality"
              value={form.nationality}
              onChange={(e) => handleChanges(index, e)}
              required
              dir="rtl"
            />
            
            <label>ID Number*</label>
            <input
              type="text"
              name="idNumber"
              placeholder="Enter ID Number"
              value={form.idNumber}
              onChange={(e) => handleChanges(index, e)}
              required
            />
          </div>
        ))}
        
        <button type="button" className="add-btn" onClick={addForm}>
          Add Visitor
        </button>

        <EnterDate />

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Processing..." : "Generate Document"}
        </button>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
      </form>
    </div>
  );
}