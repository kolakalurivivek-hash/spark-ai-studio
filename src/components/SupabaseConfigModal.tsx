import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setSupabaseCredentials, hasSupabaseConfig } from '@/lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose, onSave }: SupabaseConfigModalProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if env vars are set (read-only mode)
  const hasEnvVars = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (isOpen) {
      // Load existing localStorage values if any
      const storedUrl = localStorage.getItem('supabase-url') || '';
      const storedKey = localStorage.getItem('supabase-anon-key') || '';
      setUrl(storedUrl);
      setAnonKey(storedKey);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    setError(null);

    // Validate URL format
    if (!url.trim()) {
      setError('Supabase URL is required');
      return;
    }

    if (!url.includes('supabase.co') && !url.includes('supabase.in')) {
      setError('Please enter a valid Supabase URL');
      return;
    }

    if (!anonKey.trim()) {
      setError('Supabase Anon Key is required');
      return;
    }

    if (anonKey.length < 100) {
      setError('Anon Key appears to be invalid (too short)');
      return;
    }

    try {
      setSupabaseCredentials(url.trim(), anonKey.trim());
      setSuccess(true);
      setTimeout(() => {
        onSave();
      }, 500);
    } catch (err) {
      setError('Failed to save credentials');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md glass-strong rounded-2xl p-6 neon-glow"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Supabase Config</h2>
                  <p className="text-xs text-muted-foreground">
                    {hasEnvVars ? 'Using environment variables' : 'Enter your credentials'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {hasEnvVars ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-neon-green/10 border border-neon-green/30">
                  <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-neon-green">Environment Variables Detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supabase is configured via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
                    </p>
                  </div>
                </div>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info Box */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    For testing, enter your Supabase credentials below. For production (Vercel), set{' '}
                    <code className="text-primary">VITE_SUPABASE_URL</code> and{' '}
                    <code className="text-primary">VITE_SUPABASE_ANON_KEY</code> as environment variables.
                  </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/20 border border-destructive/30"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <span className="text-sm text-destructive">{error}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-neon-green/20 border border-neon-green/30"
                  >
                    <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" />
                    <span className="text-sm text-neon-green">Credentials saved!</span>
                  </motion.div>
                )}

                {/* URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="supabase-url" className="text-foreground text-sm">
                    Supabase URL
                  </Label>
                  <div className="relative">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="supabase-url"
                      type="url"
                      placeholder="https://your-project.supabase.co"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-10 bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                </div>

                {/* Anon Key Input */}
                <div className="space-y-2">
                  <Label htmlFor="supabase-key" className="text-foreground text-sm">
                    Anon Key (Public)
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="supabase-key"
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      className="pl-10 bg-muted/50 border-border focus:border-primary font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="flex-1 gradient-cyber text-primary-foreground">
                    Save Credentials
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
