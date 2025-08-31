import { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
}

export const Typewriter = ({ text, speed = 20 }: TypewriterProps) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText(''); // Reset when text changes
    let i = 0;
    const intervalId = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  return <p className="mb-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{displayedText}</p>;
};