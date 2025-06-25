
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
    
    // Also log to console for debugging
    console.log('Chat data saved:', chatData);
  } catch (error) {
    console.error('Failed to save chat data:', error);
  }
};

export const loadChatData = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const chatData: ChatData = JSON.parse(stored);
    
    // Validate data structure
    if (!chatData.messages || !Array.isArray(chatData.messages)) {
      console.warn('Invalid chat data structure, returning empty array');
      return [];
    }
    
    console.log('Chat data loaded:', chatData);
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
    console.log('Chat data cleared');
  } catch (error) {
    console.error('Failed to clear chat data:', error);
  }
};
