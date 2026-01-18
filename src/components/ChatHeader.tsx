import { motion } from 'framer-motion';
import { Sparkles, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  onClear: () => void;
  onSettingsClick: () => void;
  messageCount: number;
}

export function ChatHeader({ onClear, onSettingsClick, messageCount }: ChatHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl px-4 py-3 flex items-center justify-between mb-4"
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </motion.div>
        <div>
          <h1 className="font-semibold text-foreground">Cyber Chat</h1>
          <p className="text-xs text-muted-foreground">
            {messageCount > 0 ? `${messageCount} messages` : 'Ready to chat'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Settings className="w-5 h-5" />
        </Button>
        {messageCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
