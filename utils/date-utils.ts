/**
 * Date utility functions for consistent date handling throughout the app
 */

/**
 * Converts date input to ISO format for storage
 * Handles various locale formats (DD/MM/YYYY, MM/DD/YYYY, etc.)
 */
export const parseDateFromInput = (inputText: string): string => {
  if (!inputText.trim()) return '';
  
  try {
    // Try to parse the input as a date
    const parsedDate = new Date(inputText);
    if (!isNaN(parsedDate.getTime())) {
      const isoFormat = parsedDate.toISOString().split('T')[0];
      return isoFormat;
    }
  } catch (error) {
    // Silent error handling
  }
  
  // If it already looks like ISO format (YYYY-MM-DD), return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(inputText)) {
    return inputText;
  }
  
  // If parsing fails, try to handle common locale formats
  try {
    // Split by common separators and try to construct a date
    const parts = inputText.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const num1 = parseInt(parts[0]);
      const num2 = parseInt(parts[1]);
      const num3 = parseInt(parts[2]);
      
      let month, day, year;
      
      // Determine year (should be the 4-digit number)
      if (num3 > 31) {
        // Third part is year (DD/MM/YYYY or MM/DD/YYYY)
        year = num3;
        
        // Determine day vs month based on values
        if (num1 > 12) {
          // First number > 12, so it must be day (DD/MM/YYYY)
          day = num1;
          month = num2 - 1; // Month is 0-indexed
        } else if (num2 > 12) {
          // Second number > 12, so it must be day (MM/DD/YYYY)
          month = num1 - 1; // Month is 0-indexed
          day = num2;
        } else {
          // Both numbers <= 12, ambiguous. Default to DD/MM/YYYY format
          day = num1;
          month = num2 - 1;
        }
      } else {
        // Try YYYY/MM/DD format
        year = num1;
        month = num2 - 1;
        day = num3;
      }
      
      const date = new Date(year, month, day, 12, 0, 0); // Use noon to avoid timezone issues
      if (!isNaN(date.getTime())) {
        const isoFormat = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return isoFormat;
      }
    }
  } catch (error) {
    // Silent error handling
  }
  
  return inputText;
};

/**
 * Converts stored ISO date to display format for form editing
 */
export const formatDateForDisplay = (dateInput: string): string => {
  if (!dateInput) return '';
  
  try {
    let date;
    
    // If it looks like ISO format (YYYY-MM-DD), parse it carefully
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      // Parse ISO date by adding time to avoid timezone issues
      date = new Date(dateInput + 'T12:00:00');
    } else {
      // Try parsing as is
      date = new Date(dateInput);
    }
    
    if (!isNaN(date.getTime())) {
      const formatted = date.toLocaleDateString();
      return formatted;
    }
  } catch (error) {
    // Silent error handling
  }
  
  return dateInput;
};

/**
 * Safe date display function to avoid "Invalid Date" in UI
 * Used for displaying dates in task lists
 */
export const safeFormatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    let date;
    
    // If it looks like ISO format (YYYY-MM-DD), parse it safely to avoid timezone issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Always add T12:00:00 for ISO dates to avoid timezone conversion
      date = new Date(dateString + 'T12:00:00');
    } else {
      // For other formats, try parsing as is
      date = new Date(dateString);
      
      // If that fails, try adding T12:00:00
      if (isNaN(date.getTime())) {
        date = new Date(dateString + 'T12:00:00');
      }
    }
    
    // If still invalid, return empty string
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const formatted = date.toLocaleDateString();
    return formatted;
  } catch (error) {
    return '';
  }
};