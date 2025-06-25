// src/utils/chatStorage.ts

export type SafetyStatus = 'safe' | 'suspicious' | 'spam' | 'checking';

export interface ChatMessage {
  uname: string;
  timestamp: string;
  message: string;
}

export interface EnhancedChatMessage extends ChatMessage {
  safetyStatus?: SafetyStatus;
  confidence?: number;
  isProcessing?: boolean;
  scamCheckTimestamp?: string; // When the scam check was performed
}

export interface ChatData {
  messages: ChatMessage[];
  lastUpdated: string;
  version: string;
}

export interface EnhancedChatData {
  messages: EnhancedChatMessage[];
  lastUpdated: string;
  version: string;
  scamFilterEnabled: boolean;
}

const STORAGE_KEY = 'nordic-chat-data';
const ENHANCED_STORAGE_KEY = 'nordic-chat-enhanced-data';
const STORAGE_VERSION = '2.0'; // Updated version for enhanced data

// Save basic chat data (for compatibility)
export const saveChatData = (messages: ChatMessage[]): void => {
  try {
    const chatData: ChatData = {
      messages,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
    
    const jsonString = JSON.stringify(chatData, null, 2);
    localStorage.setItem(STORAGE_KEY, jsonString);
    
    console.log('Basic chat data saved to localStorage:', chatData);
  } catch (error) {
    console.error('Failed to save chat data:', error);
  }
};

// Save enhanced chat data with safety information
export const saveEnhancedChatData = (messages: EnhancedChatMessage[]): void => {
  try {
    const enhancedChatData: EnhancedChatData = {
      messages,
      lastUpdated: new Date().toISOString(),
      version: STORAGE_VERSION,
      scamFilterEnabled: true
    };
    
    const jsonString = JSON.stringify(enhancedChatData, null, 2);
    localStorage.setItem(ENHANCED_STORAGE_KEY, jsonString);
    
    // Also save basic version for backward compatibility
    const basicMessages: ChatMessage[] = messages.map(({ safetyStatus, confidence, isProcessing, scamCheckTimestamp, ...baseMsg }) => baseMsg);
    saveChatData(basicMessages);
    
    console.log('Enhanced chat data saved to localStorage:', enhancedChatData);
  } catch (error) {
    console.error('Failed to save enhanced chat data:', error);
  }
};

// Load enhanced chat data with safety information
export const loadEnhancedChatData = (): EnhancedChatMessage[] => {
  try {
    console.log('Loading enhanced chat data from localStorage...');
    
    // Try to load enhanced data first
    const enhancedStored = localStorage.getItem(ENHANCED_STORAGE_KEY);
    if (enhancedStored) {
      const enhancedChatData: EnhancedChatData = JSON.parse(enhancedStored);
      if (enhancedChatData.messages && Array.isArray(enhancedChatData.messages)) {
        console.log('Successfully loaded enhanced messages:', enhancedChatData.messages);
        return enhancedChatData.messages;
      }
    }
    
    // Fallback to basic data
    const basicMessages = loadChatData();
    const enhancedMessages: EnhancedChatMessage[] = basicMessages.map(msg => ({
      ...msg,
      safetyStatus: 'safe' as SafetyStatus, // Default to safe for old messages
      confidence: 0.8,
      isProcessing: false
    }));
    
    console.log('Loaded basic messages and enhanced them:', enhancedMessages);
    return enhancedMessages;
  } catch (error) {
    console.error('Failed to load enhanced chat data:', error);
    return [];
  }
};

// Load basic chat data (original function for compatibility)
export const loadChatData = (): ChatMessage[] => {
  try {
    console.log('Loading basic chat data from localStorage...');
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

// Export enhanced chat as JSON
export const exportEnhancedChatAsJSON = (): string => {
  const messages = loadEnhancedChatData();
  const exportData: EnhancedChatData = {
    messages,
    lastUpdated: new Date().toISOString(),
    version: STORAGE_VERSION,
    scamFilterEnabled: true
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Export basic chat as JSON (original function for compatibility)
export const exportChatAsJSON = (): string => {
  const messages = loadChatData();
  const exportData: ChatData = {
    messages,
    lastUpdated: new Date().toISOString(),
    version: '1.0'
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Clear all chat data
export const clearChatData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ENHANCED_STORAGE_KEY);
    localStorage.removeItem('chatMessages'); // Remove old storage key if exists
    localStorage.removeItem('chatUsername');
    console.log('All chat data cleared from localStorage');
    console.log('Remaining localStorage keys:', Object.keys(localStorage));
  } catch (error) {
    console.error('Failed to clear chat data:', error);
  }
};

// Get statistics about chat safety
export const getChatSafetyStats = (): {
  total: number;
  safe: number;
  suspicious: number;
  spam: number;
  unchecked: number;
} => {
  const messages = loadEnhancedChatData();
  
  const stats = {
    total: messages.length,
    safe: 0,
    suspicious: 0,
    spam: 0,
    unchecked: 0
  };
  
  messages.forEach(msg => {
    switch (msg.safetyStatus) {
      case 'safe':
        stats.safe++;
        break;
      case 'suspicious':
        stats.suspicious++;
        break;
      case 'spam':
        stats.spam++;
        break;
      default:
        stats.unchecked++;
        break;
    }
  });
  
  return stats;
};

// Find potentially dangerous messages
export const findDangerousMessages = (): EnhancedChatMessage[] => {
  const messages = loadEnhancedChatData();
  return messages.filter(msg => 
    msg.safetyStatus === 'spam' || 
    (msg.safetyStatus === 'suspicious' && (msg.confidence || 0) > 0.7)
  );
};

// Debug function to check localStorage status
export const debugLocalStorage = (): void => {
  console.log('=== localStorage Debug Info ===');
  console.log('Basic storage key:', STORAGE_KEY);
  console.log('Enhanced storage key:', ENHANCED_STORAGE_KEY);
  console.log('localStorage available:', typeof(Storage) !== "undefined");
  console.log('Current localStorage length:', localStorage.length);
  console.log('All localStorage keys:', Object.keys(localStorage));
  console.log('Basic data:', localStorage.getItem(STORAGE_KEY));
  console.log('Enhanced data:', localStorage.getItem(ENHANCED_STORAGE_KEY));
  console.log('Safety stats:', getChatSafetyStats());
  console.log('==============================');
};