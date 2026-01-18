import { useState, useCallback, useRef } from 'react';
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

  // Prevent duplicate submissions / race conditions
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingIdRef = useRef<string | null>(null);

  const setApiKey = useCallback(
    (key: string) => {
      setApiKeyState(key);
      setError(null);
    },
    [setApiKeyState]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoadingRef.current) return;

      if (!apiKey) {
        setError('Please enter your Groq API key first');
        return;
      }

      // Abort any in-flight request (e.g. StrictMode double-invoke)
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const userMessage: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      streamingIdRef.current = assistantId;

      // Snapshot current messages (useLocalStorage setter is safe, but not synchronous)
      const currentMessages = [...messages, userMessage];

      // Render user + empty assistant immediately
      setMessages([
        ...currentMessages,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        },
      ]);

      setIsLoading(true);
      isLoadingRef.current = true;
      setError(null);

      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
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

        // Robust SSE parsing: line-by-line, buffers partial JSON
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;

          // If another stream started, stop processing this one
          if (streamingIdRef.current !== assistantId) {
            await reader.cancel();
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const delta: string | undefined = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
                );
              }
            } catch {
              // JSON split across chunks: put line back and wait for more data
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;

        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setMessages((prev) => prev.filter((m) => m.role === 'user' || m.content));
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
        streamingIdRef.current = null;
        abortControllerRef.current = null;
      }
    },
    [apiKey, messages, setMessages]
  );

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
