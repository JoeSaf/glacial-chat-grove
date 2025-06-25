import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Shield, AlertTriangle, Ban, Download, Trash2 } from 'lucide-react';
import { saveChatData, loadChatData, exportChatAsJSON, clearChatData, ChatMessage } from '../utils/chatStorage';

type SafetyStatus = 'safe' | 'suspicious' | 'spam';

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [username, setUsername] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load messages using the new JSON storage utility
    const savedMessages = loadChatData();
    const savedUsername = localStorage.getItem('chatUsername');
    
    setMessages(savedMessages);
    
    if (savedUsername) {
      setUsername(savedUsername);
      setIsUsernameSet(true);
    }
  }, []);

  useEffect(() => {
    // Save messages using the new JSON storage utility
    if (messages.length > 0) {
      saveChatData(messages);
    }
  }, [messages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
      localStorage.setItem('chatUsername', username);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const shouldShowDateDivider = (currentMsg: ChatMessage, prevMsg: ChatMessage | null) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    
    return currentDate !== prevDate;
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && username) {
      const newMessage: ChatMessage = {
        uname: username,
        timestamp: new Date().toISOString(),
        message: currentMessage.trim()
      };

      setMessages(prev => [...prev, newMessage]);
      setCurrentMessage('');
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonData = exportChatAsJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nordic-chat-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export chat data:', error);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
      clearChatData();
      setMessages([]);
    }
  };

  const getMessageSafety = (message: string): SafetyStatus => {
    const lowerMessage = message.toLowerCase();
    
    // Simple spam detection
    const spamKeywords = ['click here', 'free money', 'urgent', 'winner', 'congratulations', 'claim now'];
    if (spamKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'spam';
    }
    
    // Simple suspicious content detection
    const suspiciousKeywords = ['password', 'login', 'account', 'verify', 'suspended', 'click link'];
    if (suspiciousKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'suspicious';
    }
    
    return 'safe';
  };

  const getSafetyIcon = (status: SafetyStatus) => {
    switch (status) {
      case 'safe':
        return <Shield className="w-3 h-3" />;
      case 'suspicious':
        return <AlertTriangle className="w-3 h-3" />;
      case 'spam':
        return <Ban className="w-3 h-3" />;
    }
  };

  const getSafetyColor = (status: SafetyStatus) => {
    switch (status) {
      case 'safe':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'suspicious':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'spam':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-600 rounded-full mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-light text-slate-800 mb-2">Join the Chat</h1>
            <p className="text-slate-600 text-sm">Enter your name to start chatting</p>
          </div>
          
          <form onSubmit={handleUsernameSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200"
                maxLength={20}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Continue
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-light text-slate-800">Group Chat</h1>
              <p className="text-sm text-slate-500">Welcome, {username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export chat as JSON"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all messages"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            
            <button
              onClick={() => {
                setIsUsernameSet(false);
                setUsername('');
                localStorage.removeItem('chatUsername');
              }}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Change Name
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showDateDivider = shouldShowDateDivider(msg, prevMsg);
              const safetyStatus = getMessageSafety(msg.message);
              
              return (
                <div key={index}>
                  {showDateDivider && (
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full">
                        {formatDate(msg.timestamp)}
                      </span>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>
                  )}
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/50 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {msg.uname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-slate-800">{msg.uname}</span>
                      <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed ml-11 mb-3">{msg.message}</p>
                    
                    {/* Safety Indicator */}
                    <div className="ml-11">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getSafetyColor(safetyStatus)}`}>
                        {getSafetyIcon(safetyStatus)}
                        <span className="capitalize">{safetyStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200/50 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleMessageSubmit} className="flex gap-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200"
              maxLength={500}
              required
            />
            <button
              type="submit"
              className="bg-slate-600 hover:bg-slate-700 text-white p-3 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
