'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { useAppContext } from './AppContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function TheoryCoach() {
  const { currentContext } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hey there! I'm your AI Theory Coach. Whether you're wondering what modes work over a ii-V-I progression, how to build a dominant 7th chord, or just need some practice tips, I'm here to help. What's on your mind today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing. Please configure it in the AI Studio environment.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `You are an experienced, encouraging guitar and music theory teacher. 
      You give concise, practical answers. You explain concepts clearly, often relating them back to the guitar fretboard.
      Keep your responses relatively short and focused on actionable advice or clear explanations.
      Use markdown for formatting (bolding key terms, creating lists for steps).
      
      The user is currently using a guitar training app. Their current context is: "${currentContext}".
      If relevant, tailor your advice to this context.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const modelResponse = response.text || "I'm sorry, I couldn't generate a response.";
      
      setMessages((prev) => [...prev, { role: 'model', text: modelResponse }]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Oops! Something went wrong while trying to answer your question. Please try again later.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Theory Coach <Sparkles className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-zinc-400 mt-1">Ask any music theory or guitar-related questions.</p>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-500' : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-400" />}
              </div>
              
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-indigo-500 text-white rounded-tr-sm'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-sm'
                }`}
              >
                <div className={`prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700 ${msg.role === 'user' ? 'text-white' : ''}`}>
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-sm text-zinc-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <form onSubmit={handleSubmit} className="flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about scales, chords, progressions..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl px-6 py-3 font-medium transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20 disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
