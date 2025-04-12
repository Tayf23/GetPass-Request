import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDay, format } from "date-fns";
import { ar } from "date-fns/locale"; // Arabic locale
import "./EnterDate.css";

// Function to format date as ISO string keeping exactly the same date
function formatDateForAPI(date) {
  // Create date string in YYYY-MM-DD format to ensure no timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function EnterDate({ onDatesChange }) {
  const [selectedDates, setSelectedDates] = useState([]);
  
  // Notify parent component whenever dates change
  const updateDates = (newDates) => {
    setSelectedDates(newDates);
    
    // Format dates for API and pass to parent
    const formattedDates = newDates.map(item => ({
      date: item.date
    }));
    
    onDatesChange(formattedDates);
  };

  const handleDateChange = (date) => {
    if (date) {
      // Check if date is already selected
      const alreadySelected = selectedDates.some(
        item => item.dateObject &&
        item.dateObject.getFullYear() === date.getFullYear() &&
        item.dateObject.getMonth() === date.getMonth() &&
        item.dateObject.getDate() === date.getDate()
      );
      
      if (!alreadySelected) {
        // Store just the date in YYYY-MM-DD format for the API to avoid timezone issues
        const newDateEntry = {
          date: formatDateForAPI(date),
          dateObject: date // Keep a Date object for UI display
        };
        
        // Add the new date and sort the array
        const updatedDates = [...selectedDates, newDateEntry].sort((a, b) =>
          a.dateObject.getTime() - b.dateObject.getTime()
        );
        
        updateDates(updatedDates);
      }
    }
  };
  
  const removeDate = (index) => {
    const updatedDates = selectedDates.filter((_, i) => i !== index);
    updateDates(updatedDates);
  };
  
  const clearAllDates = () => {
    updateDates([]);
  };
  
  const isWeekend = (date) => {
    const day = getDay(date); // 5 = Friday, 6 = Saturday
    return day === 5 || day === 6;
  };
  
  return (
    <div className="date-picker-container">
      <div className="date-header">
        <h4 className="h4">Select Dates for GetPass</h4>
        {selectedDates.length > 0 && (
          <button 
            type="button"
            className="clear-all-btn"
            onClick={clearAllDates}
          >
            Clear All Dates
          </button>
        )}
      </div>
      
      <DatePicker
        selected={null}
        onChange={handleDateChange}
        filterDate={(date) => !isWeekend(date)}
        minDate={new Date()}
        placeholderText="📅 Choose weekdays"
        shouldCloseOnSelect={false}
        locale={ar}
        dateFormat="dd/MM/yyyy"
      />
      
      <h4 className="h4">Selected Dates:</h4>
      {selectedDates.length > 0 ? (
        <ul className="ull">
          {selectedDates.map((dateEntry, index) => (
            <li key={index} className="lli">
              <div className="date-text">
                📅 {dateEntry.dateObject && format(dateEntry.dateObject, "EEEE, dd/MM/yyyy", { locale: ar })}
              </div>
              <button
                className="delete-btn"
                onClick={() => removeDate(index)}
                type="button"
                title="حذف"
                aria-label="Delete date"
              >
                ❌
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="date-warning">Please select at least one date for the GetPass document</p>
      )}
    </div>
  );
}

export default EnterDate;