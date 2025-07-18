import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Phone } from 'lucide-react';

const WEBHOOK_URL = 'https://n8n-orangecarrot-u49460.vm.elestio.app/webhook/ffe6d5ca-015d-46b2-8645-9e24cbfd5def';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant' | 'typing' | 'error';
  timestamp: Date;
}


const RestoreChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  // Handle mobile keyboard detection and viewport changes
  useEffect(() => {
    const handleResize = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;
      const keyboardHeight = screenHeight - vh;
      
      // Detect if keyboard is open (significant height difference)
      const keyboardOpen = keyboardHeight > 150;
      setIsKeyboardOpen(keyboardOpen);
      
      if (keyboardOpen && inputContainerRef.current) {
        // Scroll input into view when keyboard opens
        setTimeout(() => {
          inputContainerRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end' 
          });
        }, 100);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
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

    // Reset textarea height and maintain focus
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Keep focus on mobile to prevent keyboard from closing
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
      // Maintain focus after response
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
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


  const handlePhoneClick = () => {
    window.open('tel:+15619029938', '_self');
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
    <div className="h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center p-0">
      <div 
        className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden h-full rounded-none sm:h-[90vh] sm:rounded-3xl"
        style={{
          height: isKeyboardOpen ? '100vh' : '100vh',
          maxHeight: isKeyboardOpen ? '100vh' : '100vh'
        }}
      >
        {/* Header - Fixed height with better mobile padding */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-2 sm:p-4 text-center relative overflow-hidden flex-shrink-0">
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
              className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 z-10 min-w-[40px] min-h-[40px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center"
              title="Back to main menu"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Phone Button */}
          <button
            onClick={handlePhoneClick}
            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 z-10 min-w-[40px] min-h-[40px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center"
            title="Call us"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <h1 className="text-base sm:text-xl font-semibold mb-1 relative z-10 px-12 sm:px-0">Restore AI Assistant</h1>
          <p className="text-xs opacity-90 mb-1 sm:mb-2 relative z-10">Advanced Foot Care Support</p>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs">Connected to Dr. Bhela's Practice</span>
          </div>
        </div>

        {/* Messages and Initial Content - Flexible height with proper overflow */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white"
          style={{
            minHeight: 0,
            paddingBottom: isKeyboardOpen ? '4px' : '8px'
          }}
        >
          {showQuickPrompts && (
            <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 sm:p-4 rounded-2xl relative overflow-hidden shadow-lg">
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 text-lg sm:text-xl opacity-70">🦶</div>
                <h3 className="text-sm sm:text-base font-semibold mb-2 pr-6 sm:pr-8 leading-tight">Welcome to Restore Podiatry!</h3>
                <p className="text-xs sm:text-sm leading-relaxed opacity-95 pr-2">
                  I'm here to help you learn about our advanced, non-invasive laser treatments and foot care services. I can provide general information about our procedures, practice hours, location, and help you schedule an appointment.
                </p>
              </div>

            </div>
          )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] p-2.5 sm:p-3 rounded-2xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.type === 'assistant'
                        ? 'bg-white text-slate-800 border border-gray-200'
                        : message.type === 'typing'
                        ? 'bg-gray-200 text-slate-600 animate-pulse'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {formatMessageText(message.text)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Fixed at bottom with improved mobile sizing */}
        <div 
          ref={inputContainerRef}
          className="bg-white border-t border-gray-100 flex-shrink-0 p-2 sm:p-3"
          style={{
            paddingBottom: isKeyboardOpen ? '4px' : '8px'
          }}
        >
          <div className="flex gap-1.5 sm:gap-2 items-end bg-gray-50 rounded-2xl p-1.5 sm:p-2 border-2 border-gray-200 focus-within:border-blue-400 focus-within:shadow-sm transition-all">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                // Scroll input into view on focus (mobile)
                setTimeout(() => {
                  inputContainerRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end' 
                  });
                }, 200);
              }}
              placeholder="Ask about foot pain, treatments, appointments..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none p-1.5 sm:p-2 text-xs sm:text-sm resize-none min-h-[20px] max-h-[100px] leading-relaxed disabled:opacity-50"
              rows={1}
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-1.5 sm:p-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center min-w-[32px] sm:min-w-[40px] flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreChatbot;
