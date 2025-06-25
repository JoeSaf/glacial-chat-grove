
import { ChatMessage } from './chatStorage';

// Create a file-safe timestamp for filenames
const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

const getTimeString = (date: Date): string => {
  return date.toISOString().replace(/[:.]/g, '-'); // Safe for filenames
};

// Save individual message to file system (simulated with localStorage for web)
export const saveMessageToFile = async (message: ChatMessage): Promise<void> => {
  try {
    const messageDate = new Date(message.timestamp);
    const dateStr = getDateString(messageDate);
    const timeStr = getTimeString(messageDate);
    
    // Create filename: messages/YYYY-MM-DD/HH-MM-SS-username.json
    const fileName = `messages/${dateStr}/${timeStr}-${message.uname}.json`;
    
    // For web environment, we'll simulate file storage using localStorage
    // In a real file system, this would write to actual files
    const messageData = {
      ...message,
      fileName,
      savedAt: new Date().toISOString()
    };
    
    // Store in localStorage with file-like key structure
    localStorage.setItem(`file:${fileName}`, JSON.stringify(messageData, null, 2));
    
    // Also maintain an index of all message files
    const indexKey = 'file:messages/index.json';
    const existingIndex = localStorage.getItem(indexKey);
    const messageIndex = existingIndex ? JSON.parse(existingIndex) : { files: [], lastUpdated: null };
    
    if (!messageIndex.files.includes(fileName)) {
      messageIndex.files.push(fileName);
      messageIndex.lastUpdated = new Date().toISOString();
      localStorage.setItem(indexKey, JSON.stringify(messageIndex, null, 2));
    }
    
    console.log(`Message saved to file: ${fileName}`);
    console.log('Message data:', messageData);
    
  } catch (error) {
    console.error('Failed to save message to file:', error);
  }
};

// Get all messages from files for a specific date
export const getMessagesForDate = (date: string): ChatMessage[] => {
  try {
    const messages: ChatMessage[] = [];
    const prefix = `file:messages/${date}/`;
    
    // Scan localStorage for files matching the date pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key.endsWith('.json')) {
        const data = localStorage.getItem(key);
        if (data) {
          const messageData = JSON.parse(data);
          messages.push({
            uname: messageData.uname,
            timestamp: messageData.timestamp,
            message: messageData.message
          });
        }
      }
    }
    
    // Sort by timestamp
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error('Failed to load messages for date:', date, error);
    return [];
  }
};

// Get all available message dates
export const getAvailableDates = (): string[] => {
  try {
    const dates = new Set<string>();
    const prefix = 'file:messages/';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key.includes('/') && key.endsWith('.json')) {
        // Extract date from path like "file:messages/2023-12-25/..."
        const pathParts = key.replace(prefix, '').split('/');
        if (pathParts.length >= 2) {
          dates.add(pathParts[0]);
        }
      }
    }
    
    return Array.from(dates).sort();
  } catch (error) {
    console.error('Failed to get available dates:', error);
    return [];
  }
};

// Export all messages as organized file structure info
export const exportFileStructure = (): any => {
  try {
    const structure: any = {
      messages: {},
      exportedAt: new Date().toISOString(),
      fileCount: 0
    };
    
    const dates = getAvailableDates();
    
    dates.forEach(date => {
      const messages = getMessagesForDate(date);
      structure.messages[date] = messages;
      structure.fileCount += messages.length;
    });
    
    return structure;
  } catch (error) {
    console.error('Failed to export file structure:', error);
    return { error: 'Failed to export file structure' };
  }
};

// Clear all message files
export const clearMessageFiles = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('file:messages/')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} message files`);
  } catch (error) {
    console.error('Failed to clear message files:', error);
  }
};

// Debug function to show file structure
export const debugFileStructure = (): void => {
  console.log('=== File Structure Debug ===');
  console.log('Available dates:', getAvailableDates());
  
  const dates = getAvailableDates();
  dates.forEach(date => {
    console.log(`Messages for ${date}:`, getMessagesForDate(date).length);
  });
  
  console.log('Full structure:', exportFileStructure());
  console.log('===========================');
};
