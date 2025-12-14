import ReactMarkdown from 'react-markdown';
import React, { useState } from 'react';
import axios from 'axios';
import { Send, Bot, User } from 'lucide-react';

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am Sensaibiz. I can help manage your emails, calendar, and tasks. What needs to be done?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const token = localStorage.getItem('sensaibiz_jwt');

    try {
      const response = await axios.post('https://n8n.sensaibiz.au/webhook/chat',
        { prompt: userMessage.content },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const getAnswer = (obj) => obj?.answer || obj?.text || obj?.content || obj?.output;
      let answerText = Array.isArray(response.data) ? getAnswer(response.data[0]) : getAnswer(response.data);

      if (!answerText) answerText = "DEBUG RAW DATA: " + JSON.stringify(response.data);

      const aiMessage = { role: 'ai', content: answerText };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to the server right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} /> }}>
                {msg.content.replace(/\\n/g, '\n')}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white"><Bot size={16} /></div>
             <div className="text-slate-400 text-sm flex items-center animate-pulse">Thinking...</div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Sensaibiz to draft an email or check your calendar..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
