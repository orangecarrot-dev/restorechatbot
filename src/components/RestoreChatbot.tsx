
import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

const WEBHOOK_URL = 'https://n8n-orangecarrot-u49460.vm.elestio.app/webhook/ffe6d5ca-015d-46b2-8645-9e24cbfd5def';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant' | 'typing' | 'error';
  timestamp: Date;
}

const quickPrompts = [
  "🎯 Plantar Fasciitis Treatment Options",
  "🦶 Toenail Fungus Laser Therapy",
  "📅 Schedule an Appointment", 
  "📍 Locations & Hours",
  "⚡ Non-Invasive Treatments",
  "💳 Insurance & Pricing"
];

const RestoreChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickPrompts(false);

    // Reset textarea height and refocus
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Small delay to ensure the DOM updates first
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      text: 'Dr. Bhela\'s AI is thinking...',
      type: 'typing',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      let response;
      try {
        response = await Promise.race([
          fetch(WEBHOOK_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ text })
          }),
          timeoutPromise
        ]);
      } catch (postError) {
        const getUrl = `${WEBHOOK_URL}?text=${encodeURIComponent(text)}`;
        response = await Promise.race([
          fetch(getUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          }),
          timeoutPromise
        ]);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.message || 'No response received';

      // Remove typing indicator and add response
      setMessages(prev => prev.filter(m => m.id !== 'typing').concat({
        id: (Date.now() + 1).toString(),
        text: reply,
        type: 'assistant',
        timestamp: new Date()
      }));

    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = 'Sorry, something went wrong with our AI assistant.';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect. Please check your connection.';
        }
      }

      setMessages(prev => prev.filter(m => m.id !== 'typing').concat({
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        type: 'error',
        timestamp: new Date()
      }));
    } finally {
      setIsLoading(false);
      // Ensure focus is maintained after loading completes
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleBackToMenu = () => {
    setMessages([]);
    setShowQuickPrompts(true);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-md h-screen sm:h-[90vh] bg-white/95 backdrop-blur-xl rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 sm:p-6 text-center relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)"/>
                </svg>
              `)}")`
            }}
          ></div>
          
          {/* Back Button */}
          {!showQuickPrompts && (
            <button
              onClick={handleBackToMenu}
              className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 p-3 sm:p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 z-10 min-w-[48px] min-h-[48px] flex items-center justify-center"
              title="Back to main menu"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          
          <h1 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 relative z-10">Restore AI Assistant</h1>
          <p className="text-xs sm:text-sm opacity-90 mb-2 sm:mb-3 relative z-10">Advanced Foot Care Support</p>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs">Connected to Dr. Bhela's Practice</span>
          </div>
        </div>

        {/* Messages and Initial Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
          {showQuickPrompts && (
            <div className="p-3 sm:p-5">
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-5 rounded-2xl mb-4 sm:mb-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-xl sm:text-2xl opacity-70">🦶</div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Welcome to Restore Podiatry!</h3>
                <p className="text-sm leading-relaxed opacity-95">
                  I'm here to help you learn about our advanced, non-invasive laser treatments for foot and ankle conditions. Ask me about our services, schedule an appointment, or get information about your foot health.
                </p>
              </div>

              {/* Quick Prompts */}
              <div>
                <h4 className="text-slate-700 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">How can I help you today?</h4>
                <div className="space-y-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt)}
                      disabled={isLoading}
                      className="w-full text-left p-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-500 hover:to-blue-600 hover:text-white rounded-xl transition-all duration-300 text-sm font-medium text-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="p-3 sm:p-5 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.type === 'assistant'
                        ? 'bg-white text-slate-800 border border-gray-200'
                        : message.type === 'typing'
                        ? 'bg-gray-200 text-slate-600 animate-pulse'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {formatMessageText(message.text)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 sm:p-5 bg-white border-t border-gray-100">
          <div className="flex gap-2 sm:gap-3 items-end bg-gray-50 rounded-2xl p-2 border-2 border-gray-200 focus-within:border-blue-400 focus-within:shadow-sm transition-all">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about foot pain, treatments, appointments..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none p-2 sm:p-3 text-sm resize-none min-h-[20px] max-h-[100px] sm:max-h-[120px] leading-relaxed disabled:opacity-50"
              rows={1}
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-2 sm:p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center min-w-[40px] sm:min-w-[44px]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreChatbot;
