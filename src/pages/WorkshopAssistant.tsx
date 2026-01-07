import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  User,
  Trash2,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-assistant`;

const suggestedQuestions = [
  "How do I change brake pads on a 2020 Honda Civic?",
  "What's the torque spec for wheel lug nuts on a Ford F-150?",
  "My car is making a squealing noise when I brake - what could it be?",
  "How often should I change transmission fluid?",
];

export default function WorkshopAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get response');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(updatedMessages);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-4 flex flex-col">
      <div className="container mx-auto px-4 flex-1 flex flex-col max-w-4xl">
        {/* Header */}
        <div className="py-6 text-center flex-shrink-0">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">
              Workshop <span className="gradient-text">Assistant</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Your AI-powered mechanic helper
          </p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card p-4 mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Sparkles className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Ask me anything about car repairs, diagnostics, maintenance schedules, or technical specs!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  {suggestedQuestions.map((question, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(question)}
                      className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left text-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-secondary p-4 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-3 items-center">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearChat} title="Clear chat">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything about car repairs..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
