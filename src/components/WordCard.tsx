'use client';

import { motion } from "framer-motion";

type WordCardProps = {
  word: string;
  definition: string;
};

export default function WordCard({ word, definition }: WordCardProps) {

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(word);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="p-6 bg-primary rounded-lg shadow-md dark:bg-gray-700 dark:text-white"
    >
      <h2 className="text-2xl font-bold">{word}</h2>
      <p className="my-2">{definition}</p>
      <button onClick={speak} className="mt-4 px-4 py-2 bg-accent rounded shadow">
        🔊 Listen
      </button>
    </motion.div>
  );
}
