
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Welcome to Restore Podiatry! I'm here to help you learn about our advanced, non-invasive laser treatments for foot and ankle conditions. Ask me about our services, schedule an appointment, or get information about your foot health.",
      type: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800/90 to-blue-800/90 backdrop-blur-md border-b border-white/10 p-6 shadow-xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Restore AI Assistant</h1>
            <p className="text-blue-200 text-lg mb-1">Advanced Foot Care Support</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-300">Connected to Dr. Bhela's Practice</span>
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="p-4 bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="text-left p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 text-white text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl backdrop-blur-md shadow-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600/90 text-white ml-4'
                    : message.type === 'assistant'
                    ? 'bg-white/90 text-slate-800 mr-4 border border-white/20'
                    : message.type === 'typing'
                    ? 'bg-slate-700/90 text-slate-300 mr-4 animate-pulse'
                    : 'bg-red-500/90 text-white mr-4'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {formatMessageText(message.text)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/5 backdrop-blur-md border-t border-white/10">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about treatments, schedule appointments, or get foot care advice..."
                disabled={isLoading}
                className="w-full p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 outline-none resize-none min-h-[56px] max-h-[120px] text-slate-800 placeholder-slate-500 disabled:opacity-50"
                rows={1}
              />
              <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                Enter to send • Shift+Enter for new line
              </div>
            </div>
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center min-w-[56px]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreChatbot;
