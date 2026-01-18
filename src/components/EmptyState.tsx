import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Zap, Brain } from 'lucide-react';

const suggestions = [
  { icon: MessageSquare, text: "What's on your mind?", color: 'primary' },
  { icon: Zap, text: "Explain quantum computing", color: 'secondary' },
  { icon: Brain, text: "Help me brainstorm ideas", color: 'accent' },
];

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center neon-glow">
          <Sparkles className="w-12 h-12 text-primary-foreground" />
        </div>
        {/* Orbiting particles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary"
            animate={{
              x: [0, Math.cos(i * 120 * Math.PI / 180) * 50],
              y: [0, Math.sin(i * 120 * Math.PI / 180) * 50],
              scale: [1, 0.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
            style={{ top: '50%', left: '50%', marginTop: -6, marginLeft: -6 }}
          />
        ))}
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold gradient-text mb-3 text-center"
      >
        Cyber Chat
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center mb-8 max-w-md"
      >
        Your AI companion powered by GPT-4o-mini. Ask anything, explore ideas, or just chat.
      </motion.p>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {suggestions.map((suggestion, i) => {
          const Icon = suggestion.icon;
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="glass px-4 py-3 rounded-xl flex items-center gap-2 hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <Icon className={`w-4 h-4 text-${suggestion.color} group-hover:scale-110 transition-transform`} />
              <span className="text-sm text-foreground">{suggestion.text}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
