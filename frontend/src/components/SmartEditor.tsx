import { useEditor, EditorContent, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion } from 'framer-motion';
import { Wand2, TextQuote } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl">
        {/* AI Toolbar */}
        <motion.div
          className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-500 p-4 rounded-t-2xl"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <div className="flex items-center gap-4 text-white">
            <Wand2 className="h-6 w-6" />
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-lg bg-white/10"
                onClick={() => handleAISuggestion('paraphrase')}
              >
                Paraphrase
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-lg bg-white/10"
                onClick={() => handleAISuggestion('shorten')}
              >
                Shorten
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-lg bg-white/10"
                onClick={() => handleAISuggestion('expand')}
              >
                Expand
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Editor Content */}
        <div className="p-8 min-h-[600px] relative">
          <EditorContent editor={editor} />
          
          {/* Citation Popover */}
          {citationPopover && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-4 top-16 bg-white p-4 rounded-lg shadow-lg"
            >
              <input
                type="text"
                placeholder="Search citations..."
                className="p-2 border rounded-lg w-64"
              />
              <div className="mt-2 space-y-2">
                {/* Citation items would go here */}
              </div>
            </motion.div>
          )}

          {/* Floating Format Menu */}
          <FloatingMenu editor={editor}>
            <motion.div
              className="flex gap-2 bg-white p-2 rounded-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="p-2 hover:bg-purple-50 rounded"
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="p-2 hover:bg-purple-50 rounded"
              >
                • List
              </button>
              <button
                onClick={() => setCitationPopover(true)}
                className="p-2 hover:bg-purple-50 rounded"
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