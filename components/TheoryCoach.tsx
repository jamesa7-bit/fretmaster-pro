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
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#10b981]" />

      <div className="flex flex-col h-full p-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            Theory Coach <Sparkles className="w-5 h-5 text-[#10b981]" />
          </h1>
          <p className="text-[#10b981] font-light tracking-[0.2em] uppercase text-xs mt-1">AI-powered music theory help</p>
        </div>

        <div className="flex-1 bg-[#1A1A1A] border border-white/8 rounded-[12px] flex flex-col overflow-hidden min-h-0">
          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-[#10b981]' : 'bg-[#222] border border-white/10'
                  }`}
                >
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-[#0A0A0A]" />
                    : <Bot className="w-4 h-4 text-[#10b981]" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-[10px] px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#10b981] text-[#0A0A0A] rounded-tr-sm font-medium'
                      : 'bg-[#222] text-white/90 border border-white/8 rounded-tl-sm'
                  }`}
                >
                  <div className={`prose max-w-none prose-p:leading-relaxed prose-p:my-1 prose-pre:bg-[#0A0A0A] prose-pre:border prose-pre:border-white/10 prose-pre:text-xs ${
                    msg.role === 'user'
                      ? 'prose-headings:text-[#0A0A0A] prose-strong:text-[#0A0A0A] prose-li:text-[#0A0A0A]'
                      : 'prose-invert prose-headings:text-white prose-strong:text-white prose-li:text-white/90'
                  }`}>
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 flex-row">
                <div className="w-9 h-9 rounded-full bg-[#222] border border-white/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[#10b981]" />
                </div>
                <div className="bg-[#222] border border-white/8 rounded-[10px] rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#10b981]" />
                  <span className="text-sm text-white/40">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 bg-[#141414] border-t border-white/8">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about scales, chords, progressions..."
                className="flex-1 bg-[#222] border border-white/10 rounded-[8px] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#10b981]/40 focus:border-[#10b981] transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-[#10b981] hover:bg-[#059669] disabled:bg-[#1A1A1A] disabled:text-white/20 text-[#0A0A0A] rounded-[8px] px-4 py-2.5 font-bold transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
