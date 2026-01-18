import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

export function useChat() {
  const [messages, setMessages] = useLocalStorage<Message[]>('chat-messages', []);
  const [apiKey, setApiKeyState] = useLocalStorage<string>('groq-api-key', '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to prevent race conditions during streaming
  const isLoadingRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  
  // Keep messagesRef in sync using useEffect (not during render)
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    setError(null);
  }, [setApiKeyState]);

  const sendMessage = useCallback(async (content: string) => {
    // Prevent duplicate submissions
    if (isLoadingRef.current) return;
    
    if (!apiKey) {
      setError('Please enter your Groq API key first');
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Get current messages from ref to avoid stale closure
    const currentMessages = [...messagesRef.current, userMessage];
    
    setMessages(currentMessages);
    setIsLoading(true);
    isLoadingRef.current = true;
    setError(null);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: currentMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = `assistant-${Date.now()}`;

      // Add empty assistant message
      const messagesWithAssistant = [...currentMessages, {
        id: assistantId,
        role: 'assistant' as const,
        content: '',
        timestamp: Date.now(),
      }];
      setMessages(messagesWithAssistant);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                // Update only the assistant message content
                setMessages(prev => prev.map(m => 
                  m.id === assistantId 
                    ? { ...m, content: assistantContent }
                    : m
                ));
              }
            } catch (e) {
              // Skip invalid JSON (might be partial chunk)
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(m => m.role === 'user' || m.content));
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [apiKey, setMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  return {
    messages,
    isLoading,
    error,
    apiKey,
    setApiKey,
    sendMessage,
    clearMessages,
  };
}
