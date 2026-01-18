import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { EmptyState } from '@/components/EmptyState';
import { ApiKeyInput } from '@/components/ApiKeyInput';

export default function Chat() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { messages, isLoading, error, apiKey, setApiKey, sendMessage, clearMessages } = useChat();
  const [showSettings, setShowSettings] = useState(!apiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 container max-w-3xl mx-auto p-4 min-h-screen flex flex-col">
        <ChatHeader
          onClear={clearMessages}
          onSettingsClick={() => setShowSettings(!showSettings)}
          onSignOut={handleSignOut}
          messageCount={messages.length}
          userEmail={user.email}
        />

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} error={error} />
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
          <ChatInput onSend={sendMessage} disabled={!apiKey} isLoading={isLoading} />
          {!apiKey && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-muted-foreground mt-2"
            >
              Enter your Groq API key above to start chatting
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
