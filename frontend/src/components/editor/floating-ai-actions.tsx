import React from 'react';
import { Editor } from '@tiptap/react';
import { Sparkles, Book } from 'lucide-react';

interface FloatingAIActionsProps {
  editor: Editor | null;
}

export const FloatingAIActions = ({ editor }: FloatingAIActionsProps) => {
  if (!editor) return null;

  const isSelectionEmpty = editor.state.selection.empty;

  const handleImprove = () => {
    if (isSelectionEmpty) return;
    // Handle AI improvement logic
    const selectedText = editor?.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );
    console.log('Improving text:', selectedText);
  };

  const handleCite = () => {
    if (isSelectionEmpty) return;
    // Handle citation logic
    console.log('Adding citation');
  };

  return (
    <div className="absolute top-2 right-2 glass-royal rounded-lg p-2 flex space-x-2 shadow-royal">
      <button
        onClick={handleImprove}
        disabled={isSelectionEmpty}
        className="p-2 rounded-lg hover:bg-gold-500/8 disabled:opacity-50 transition-colors"
        title="Improve writing"
      >
        <Sparkles className="h-5 w-5 text-gold-500" />
      </button>
      <button
        onClick={handleCite}
        disabled={isSelectionEmpty}
        className="p-2 rounded-lg hover:bg-gold-500/8 disabled:opacity-50 transition-colors"
        title="Add citation"
      >
        <Book className="h-5 w-5 text-parchment-100" />
      </button>
    </div>
  );
};
