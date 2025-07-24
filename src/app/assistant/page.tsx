
// src/app/assistant/page.tsx
'use client';

import React,
{
  useState,
  useRef,
  useEffect
} from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { askAssistant } from '@/ai/flows/assistant-flow';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add a placeholder for the assistant's response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const stream = await askAssistant({ query: input, userId: user.uid });
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content += chunk;
          }
          return newMessages;
        });
      }

    } catch (error) {
      console.error("Error asking assistant:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = "Sorry, I encountered an error. Please try again.";
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-10rem)] w-full justify-center">
        <Card className="w-full max-w-3xl flex flex-col">
          <CardHeader>
            <CardTitle>AI Health Assistant</CardTitle>
            <CardDescription>
              Ask questions about your health documents. For example: "Summarize my latest blood test."
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground pt-16">
                    <Bot className="mx-auto h-12 w-12 mb-4" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-4',
                      message.role === 'user' ? 'justify-end' : ''
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.content}
                      {isLoading && index === messages.length - 1 && message.content === "" && (
                         <Loader2 className="h-4 w-4 animate-spin inline-block ml-2" />
                      )}
                    </div>
                     {message.role === 'user' && (
                       <Avatar className="h-8 w-8">
                         <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                       </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your documents..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
