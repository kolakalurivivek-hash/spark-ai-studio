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
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track current streaming message to prevent duplicates
  const streamingIdRef = useRef<string | null>(null);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    setError(null);
  }, [setApiKeyState]);

  const sendMessage = useCallback(async (content: string) => {
    // Prevent duplicate submissions - critical for StrictMode
    if (isLoadingRef.current) {
      console.log('Already loading, ignoring duplicate call');
      return;
    }
    
    if (!apiKey) {
      setError('Please enter your Groq API key first');
      return;
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Prevent duplicate streaming
    if (streamingIdRef.current) {
      console.log('Already streaming, ignoring');
      return;
    }
    streamingIdRef.current = assistantId;

    // Use functional update to get current messages
    let currentMessages: Message[] = [];
    setMessages(prev => {
      currentMessages = [...prev, userMessage];
      return currentMessages;
    });

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
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';

      // Add empty assistant message using functional update
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant' as const,
        content: '',
        timestamp: Date.now(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Check if we're still the active stream
        if (streamingIdRef.current !== assistantId) {
          reader.cancel();
          break;
        }

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
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(m => m.role === 'user' || m.content));
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      streamingIdRef.current = null;
      abortControllerRef.current = null;
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
