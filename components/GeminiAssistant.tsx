import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AssistantMessage } from '../types';

interface GeminiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AssistantMessage[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ isOpen, onClose, messages, onSendMessage, isTyping }) => {
  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, scrollToBottom]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const panelClasses = `fixed inset-y-0 right-0 w-full sm:w-96 bg-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
    isOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  return (
    <div className={panelClasses} role="dialog" aria-modal="true" aria-labelledby="assistant-title">
      <div className="flex items-center justify-between p-4 bg-blue-700 text-white shadow-md flex-shrink-0">
        <h2 id="assistant-title" className="text-xl font-bold">AI Assistant</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Close assistant"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-xl shadow-sm ${
                msg.isUser
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-4 py-2 rounded-xl shadow-sm bg-gray-200 text-gray-800 rounded-bl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-700 bg-gray-900 flex items-center flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about car parts..."
          className="flex-grow p-3 border border-gray-600 bg-gray-800 text-white rounded-lg mr-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-all duration-200"
          disabled={isTyping}
          aria-label="Message input"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={isTyping || !input.trim()}
          aria-label="Send message"
        >
          <svg className="w-5 h-5 inline-block" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
          <span className="sr-only">Send</span>
        </button>
      </form>
    </div>
  );
};

export default GeminiAssistant;