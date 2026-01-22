"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MockAIService, ChatMessage } from '@/lib/ai-service';
import { Send, User, Bot, Loader2, MessageSquare, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AIChatProps {
  content: string;
}

export function AIChat({ content }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await MockAIService.chat([...messages, userMsg], content);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 text-cyan-400 mb-2" />
          <h3 className="font-semibold text-sm text-foreground mb-1">Chat Assistant</h3>
          <p className="text-xs">Ask questions about your note or ask for writing tips.</p>
        </div>
        <div className="p-4">
          <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative w-full bg-[#1e1e1e] rounded-2xl border border-cyan-500 flex items-center px-4 py-2.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white focus:outline-none border-none mr-2 font-sans"
              />
              <div className="flex items-center gap-3">
                <button type="button" className="text-zinc-400 hover:text-white transition-colors">
                  <Mic className="h-5 w-5 stroke-[1.5]" />
                </button>
                <Button
                  size="icon"
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="h-8 w-8 text-white hover:text-zinc-300 hover:bg-white/10 transition-colors bg-transparent border-none shadow-none"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex w-full gap-4",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
              msg.role === 'user'
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            )}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed transition-all duration-500",
              msg.role === 'user'
                ? "bg-cyan-500/10 text-cyan-50 border border-cyan-500/20 rounded-tr-none"
                : "bg-white/5 backdrop-blur-md text-zinc-300 border border-white/10 rounded-tl-none italic shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-zinc-600" />
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl rounded-tl-none flex items-center border border-white/10">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-[#050505]/60 backdrop-blur-xl border-t border-cyan-500/10">
        <form onSubmit={handleSubmit} className="relative w-full">
          <div className={cn(
            "relative w-full rounded-full border bg-black/40 flex items-center px-6 py-3 transition-all duration-500 overflow-hidden group",
            loading ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-cyan-500/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
          )}>
            {/* Scanning Line Animation */}
            {loading && (
              <motion.div
                className="absolute inset-0 z-0 bg-linear-to-r from-transparent via-cyan-500/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none border-none mr-4 font-medium relative z-10"
            />
            <div className="flex items-center gap-4 relative z-10">
              <button type="button" className="text-zinc-500 hover:text-cyan-400 transition-colors">
                <Mic className="h-5 w-5" />
              </button>
              <Button
                size="icon"
                type="submit"
                disabled={!input.trim() || loading}
                className="h-10 w-10 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all rounded-full bg-transparent border border-cyan-500/20 shadow-none"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
