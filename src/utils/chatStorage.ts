
export interface ChatMessage {
  uname: string;
  timestamp: string;
  message: string;
}

export interface ChatData {
  messages: ChatMessage[];
  lastUpdated: string;
  version: string;
}

const STORAGE_KEY = 'nordic-chat-data';
const STORAGE_VERSION = '1.0';

export const saveChatData = (messages: ChatMessage[]): void => {
  try {
    const chatData: ChatData = {
      messages,
      lastUpdated: new Date().toISOString(),
      version: STORAGE_VERSION
    };
    
    const jsonString = JSON.stringify(chatData, null, 2);
    localStorage.setItem(STORAGE_KEY, jsonString);
    
    // Debug logging
    console.log('Chat data saved to localStorage:', chatData);
    console.log('localStorage key:', STORAGE_KEY);
    console.log('Current localStorage contents:', localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    console.error('Failed to save chat data:', error);
  }
};

export const loadChatData = (): ChatMessage[] => {
  try {
    console.log('Loading chat data from localStorage...');
    console.log('Storage key:', STORAGE_KEY);
    
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('Raw stored data:', stored);
    
    if (!stored) {
      console.log('No stored data found, returning empty array');
      return [];
    }
    
    const chatData: ChatData = JSON.parse(stored);
    console.log('Parsed chat data:', chatData);
    
    // Validate data structure
    if (!chatData.messages || !Array.isArray(chatData.messages)) {
      console.warn('Invalid chat data structure, returning empty array');
      return [];
    }
    
    console.log('Successfully loaded messages:', chatData.messages);
    return chatData.messages;
  } catch (error) {
    console.error('Failed to load chat data:', error);
    return [];
  }
};

export const exportChatAsJSON = (): string => {
  const messages = loadChatData();
  const exportData: ChatData = {
    messages,
    lastUpdated: new Date().toISOString(),
    version: STORAGE_VERSION
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const clearChatData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('chatMessages'); // Remove old storage key if exists
    localStorage.removeItem('chatUsername');
    console.log('Chat data cleared from localStorage');
    console.log('Remaining localStorage keys:', Object.keys(localStorage));
  } catch (error) {
    console.error('Failed to clear chat data:', error);
  }
};

// Debug function to check localStorage status
export const debugLocalStorage = (): void => {
  console.log('=== localStorage Debug Info ===');
  console.log('Storage key being used:', STORAGE_KEY);
  console.log('localStorage available:', typeof(Storage) !== "undefined");
  console.log('Current localStorage length:', localStorage.length);
  console.log('All localStorage keys:', Object.keys(localStorage));
  console.log('Our data:', localStorage.getItem(STORAGE_KEY));
  console.log('==============================');
};
