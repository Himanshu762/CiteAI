import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// We'll handle the missing Collaboration import
import { FloatingAIActions } from './floating-ai-actions';

// Add this comment to explain the missing import
// Note: Install @tiptap/extension-collaboration if real-time collaboration is needed

interface SmartEditorProps {
  paperId: string;
  initialContent?: string;
}

export const SmartEditor = ({ paperId, initialContent = '<p>Start writing...</p>' }: SmartEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      // Collaboration features would be enabled here
    ],
    content: initialContent,
  });

  return (
    <div className="relative h-[calc(100vh-160px)]">
      <EditorContent editor={editor} />
      <FloatingAIActions editor={editor} />
    </div>
  );
};

export default SmartEditor; 