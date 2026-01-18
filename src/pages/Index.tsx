import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { EmptyState } from '@/components/EmptyState';
import { ApiKeyInput } from '@/components/ApiKeyInput';

const Index = () => {
  const { messages, isLoading, error, apiKey, setApiKey, sendMessage, clearMessages } = useChat();
  const [showSettings, setShowSettings] = useState(!apiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (text: string) => {
    if (apiKey) {
      sendMessage(text);
    } else {
      setShowSettings(true);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 container max-w-3xl mx-auto p-4 min-h-screen flex flex-col">
        <ChatHeader 
          onClear={clearMessages}
          onSettingsClick={() => setShowSettings(!showSettings)}
          messageCount={messages.length}
        />

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ApiKeyInput
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isTyping={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="py-4">
          <ChatInput
            onSend={sendMessage}
            disabled={!apiKey}
            isLoading={isLoading}
          />
          {!apiKey && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-muted-foreground mt-2"
            >
              Enter your API key above to start chatting
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
