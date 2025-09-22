import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface DatePickerProps {
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  onDateSave?: (isoDate: string) => void; // Optional callback for ISO format
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  placeholder = "Date (optional)",
  onDateSave
}) => {
  const { t } = useLanguage();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Helper functions for date handling
  const formatDateForDisplay = (dateInput: string | Date): string => {
    if (!dateInput) return '';
    try {
      let date: Date;
      if (typeof dateInput === 'string') {
        // If it's an ISO date string, parse it carefully to avoid timezone issues
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          const parts = dateInput.split('-');
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
        } else {
          date = new Date(dateInput);
        }
      } else {
        date = dateInput;
      }
      
      if (isNaN(date.getTime())) {
        return typeof dateInput === 'string' ? dateInput : '';
      }
      
      return date.toLocaleDateString(); // Uses device locale automatically
    } catch {
      return typeof dateInput === 'string' ? dateInput : '';
    }
  };

  const formatDateForInput = (date: Date): string => {
    // Create ISO format without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateFromInput = (inputText: string): string => {
    if (!inputText.trim()) return '';
    
    // Try to parse the input as a locale date first
    try {
      const parsedDate = new Date(inputText);
      if (!isNaN(parsedDate.getTime())) {
        const isoResult = formatDateForInput(parsedDate);
        return isoResult;
      }
    } catch {
      // If parsing fails, continue to manual parsing
    }
    
    // If it looks like ISO format (YYYY-MM-DD), return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputText)) {
      return inputText;
    }
    
    // Handle locale formats manually
    try {
      const parts = inputText.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const num1 = parseInt(parts[0]);
        const num2 = parseInt(parts[1]);
        const num3 = parseInt(parts[2]);
        
        let month, day, year;
        
        if (num3 > 31) {
          // Third part is year (DD/MM/YYYY or MM/DD/YYYY)
          year = num3;
          
          if (num1 > 12) {
            // DD/MM/YYYY format
            day = num1;
            month = num2 - 1;
          } else if (num2 > 12) {
            // MM/DD/YYYY format
            month = num1 - 1;
            day = num2;
          } else {
            // Ambiguous, assume DD/MM/YYYY
            day = num1;
            month = num2 - 1;
          }
        } else {
          // YYYY/MM/DD format
          year = num1;
          month = num2 - 1;
          day = num3;
        }
        
        const isoResult = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return isoResult;
      }
    } catch (error) {
      // Silent error handling
    }
    
    return inputText;
  };

  const getDatePlaceholder = (): string => {
    if (placeholder !== "Date (optional)") return placeholder;
    try {
      const today = new Date();
      const formatted = today.toLocaleDateString();
      return `${formatted} (optional)`;
    } catch {
      return 'Date (optional)';
    }
  };

  const handleDateInput = (text: string) => {
    // Allow more flexible input for different locale formats
    const cleaned = text.replace(/[^\d\/\-\.\s]/g, ''); // Allow common date separators
    onDateChange(cleaned);
  };

  const selectDate = (date: Date) => {
    const formattedDate = formatDateForDisplay(date);
    onDateChange(formattedDate);
    setShowCalendar(false);
    
    // Call the optional onDateSave with ISO format - use direct conversion to avoid parsing issues
    if (onDateSave) {
      const isoDate = formatDateForInput(date);
      onDateSave(isoDate);
    }
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Public method to get ISO format for saving
  const getISODate = (): string => {
    return parseDateFromInput(value);
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (day: number) => {
    if (!value) return false;
    try {
      const selectedDate = new Date(value);
      if (isNaN(selectedDate.getTime())) return false;
      return (
        day === selectedDate.getDate() &&
        currentMonth.getMonth() === selectedDate.getMonth() &&
        currentMonth.getFullYear() === selectedDate.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const getDatePreview = () => {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return value;
    } catch {
      return value;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateInputRow}>
        <TextInput
          style={[styles.input, styles.dateTextInput]}
          placeholder={getDatePlaceholder()}
          value={value}
          onChangeText={handleDateInput}
          keyboardType="default"
        />
        <TouchableOpacity 
          style={styles.calendarToggleButton}
          onPress={toggleCalendar}
        >
          <Text style={styles.calendarToggleText}>📅</Text>
        </TouchableOpacity>
      </View>
      
      {/* Calendar Component */}
      {showCalendar && (
        <View style={styles.calendar}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              style={styles.calendarNavButton}
              onPress={() => navigateMonth('prev')}
            >
              <Text style={styles.calendarNavText}>‹</Text>
            </TouchableOpacity>
            
            <Text style={styles.calendarMonthText}>
              {currentMonth.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
            
            <TouchableOpacity 
              style={styles.calendarNavButton}
              onPress={() => navigateMonth('next')}
            >
              <Text style={styles.calendarNavText}>›</Text>
            </TouchableOpacity>
          </View>
          
          {/* Days of Week Header */}
          <View style={styles.calendarWeekHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.calendarWeekDay}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  day === null && styles.calendarDayEmpty,
                  isToday(day || 0) && styles.calendarDayToday,
                  isSelectedDate(day || 0) && styles.calendarDaySelected,
                ]}
                onPress={() => {
                  if (day) {
                    // Create date in UTC to avoid timezone issues
                    const year = currentMonth.getFullYear();
                    const month = currentMonth.getMonth();
                    
                    // Create date as YYYY-MM-DD ISO string directly
                    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    // Create a date object for display purposes (using noon to avoid timezone edge cases)
                    const selectedDate = new Date(year, month, day, 12, 0, 0);
                    
                    selectDate(selectedDate);
                  }
                }}
                disabled={day === null}
              >
                {day && (
                  <Text style={[
                    styles.calendarDayText,
                    isToday(day) && styles.calendarDayTodayText,
                    isSelectedDate(day) && styles.calendarDaySelectedText,
                  ]}>
                    {day}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Date Preview */}
      {value && getDatePreview() ? (
        <View style={styles.datePreview}>
          <Text style={styles.datePreviewText}>
            {t('expected')}: {getDatePreview()}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  dateTextInput: {
    flex: 1,
  },
  calendarToggleButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  calendarToggleText: {
    fontSize: 18,
  },
  calendar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    maxHeight: 350,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    minWidth: 36,
    alignItems: 'center',
  },
  calendarNavText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    paddingVertical: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 1,
  },
  calendarDayEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDayToday: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  calendarDaySelected: {
    backgroundColor: '#007AFF',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  calendarDayTodayText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  calendarDaySelectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  datePreview: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  datePreviewText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
});