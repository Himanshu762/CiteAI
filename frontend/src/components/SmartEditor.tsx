import { useEditor, EditorContent, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion } from 'framer-motion';
import { Wand2, TextQuote } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from './ui/components';

export default function SmartEditor() {
  const [citationPopover, setCitationPopover] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your research paper...',
      }),
    ],
    content: '<p></p>',
  });

  if (!editor) return null;

  const handleAISuggestion = (action: 'paraphrase' | 'shorten' | 'expand') => {
    toast.success(`AI ${action} applied`);
    // TODO: Implement AI integration
  };

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="max-w-4xl mx-auto royal-card bg-parchment p-6 rounded-2xl shadow-royal">
        {/* AI Toolbar */}
        <motion.div
          className="sticky top-0 z-10 backdrop-royal p-4 rounded-t-2xl"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <div className="flex items-center gap-4 text-foreground">
            <Wand2 className="h-6 w-6 text-gold-500" />
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="px-4 py-2 rounded-lg bg-gold-500/10 text-gold-500"
                onClick={() => handleAISuggestion('paraphrase')}
              >
                Paraphrase
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="px-4 py-2 rounded-lg bg-gold-500/10 text-gold-500"
                onClick={() => handleAISuggestion('shorten')}
              >
                Shorten
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="px-4 py-2 rounded-lg bg-gold-500/10 text-gold-500"
                onClick={() => handleAISuggestion('expand')}
              >
                Expand
              </motion.button>
            </div>

            <div className="ml-auto">
              <Button onClick={() => editor.chain().focus().setParagraph().run()} variant="ghost">Clear</Button>
            </div>
          </div>
        </motion.div>

        {/* Editor Content */}
        <div className="p-6 min-h-[600px] relative bg-parchment rounded-lg">
          <EditorContent editor={editor} className="prose max-w-none text-foreground" />

          {/* Citation Popover */}
          {citationPopover && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-4 top-16 bg-parchment p-4 rounded-lg shadow-lg border border-border"
            >
              <input
                type="text"
                placeholder="Search citations..."
                className="p-2 border rounded-lg w-64 bg-transparent text-foreground"
              />
              <div className="mt-2 space-y-2">
                {/* Citation items would go here */}
              </div>
            </motion.div>
          )}

          {/* Floating Format Menu */}
          <FloatingMenu editor={editor}>
            <motion.div
              className="flex gap-2 bg-parchment p-2 rounded-lg shadow-lg"
              whileHover={{ scale: 1.02 }}
            >
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="p-2 hover:bg-gold-500/8 rounded"
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="p-2 hover:bg-gold-500/8 rounded"
              >
                • List
              </button>
              <button
                onClick={() => setCitationPopover(true)}
                className="p-2 hover:bg-gold-500/8 rounded"
              >
                <TextQuote className="h-4 w-4" />
              </button>
            </motion.div>
          </FloatingMenu>
        </div>
      </div>
    </div>
  );
}