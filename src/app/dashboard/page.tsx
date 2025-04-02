'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['es', 'fr']);
  const [multiTranslations, setMultiTranslations] = useState<
    { language: string; translatedText: string }[]
  >([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchRandomWord();
  }, []);

  const fetchRandomWord = async () => {
    try {
      const res = await fetch('https://random-word-api.herokuapp.com/word');
      const [randomWord] = await res.json();
      setWord(randomWord);

      const defRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${randomWord}`);
      const data = await defRes.json();
      const def = data[0]?.meanings[0]?.definitions[0]?.definition || 'Definition not found';
      setDefinition(def);

      await saveSearch(randomWord);
      await fetchHistory();
    } catch (error) {
      console.error('Failed to fetch word/definition:', error);
    }
  };

  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const res = await fetch(`https://api.datamuse.com/sug?s=${value}`);
    const data = await res.json();
    setSuggestions(data.map((item: any) => item.word));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    try {
      const defRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchTerm}`);
      const data = await defRes.json();
      const def = data[0]?.meanings[0]?.definitions[0]?.definition || 'Definition not found';
      setWord(searchTerm);
      setDefinition(def);
      setSuggestions([]);

      await saveSearch(searchTerm);
      await fetchHistory();
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const translateAll = async () => {
    if (!definition || selectedLanguages.length === 0) {
      console.warn('⚠️ No definition or languages selected');
      return;
    }
  
    try {
      const translatedResults = await Promise.all(
        selectedLanguages.map(async (lang) => {
          const res = await fetch('https://translate.argosopentech.com/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              q: definition,
              source: 'en',
              target: lang,
              format: 'text',
            }),
          });
  
          const data = await res.json();
          if (!res.ok || data.error) {
            console.error(`Translation failed for ${lang}:`, data.error || 'Unknown error');
            throw new Error(data.error || 'Translation failed');
          }
  
          return { language: lang, translatedText: data.translatedText };
        })
      );
  
      setMultiTranslations(translatedResults);
    } catch (error) {
      console.error('❌ Translation error:', error);
      alert('Translation failed. Please try again later.');
    }
  };
  

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(word);
    speechSynthesis.speak(utterance);
  };

  const saveSearch = async (word: string) => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch('/api/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, email: session.user.email }),
      });
      if (!res.ok) console.error('Save failed');
    } catch (err) {
      console.error('saveSearch() failed:', err);
    }
  };

  const fetchHistory = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch(`/api/word?email=${session.user.email}`);
      const data = await res.json();
      setHistory(data.words || []);
    } catch (err) {
      console.error('fetchHistory error:', err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome, {session?.user?.name || 'User'}!</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          placeholder="Search a word"
          value={searchTerm}
          onChange={handleTyping}
          className="w-full px-4 py-2 rounded border dark:bg-gray-800 dark:text-white"
        />
        {suggestions.length > 0 && (
          <ul className="bg-white border mt-1 rounded shadow text-sm max-h-40 overflow-y-auto">
            {suggestions.map((sug, idx) => (
              <li
                key={idx}
                onClick={() => {
                  setSearchTerm(sug);
                  setSuggestions([]);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              >
                {sug}
              </li>
            ))}
          </ul>
        )}
        <button
          type="submit"
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-500"
        >
          Search
        </button>
      </form>

      {/* Recent Searches */}
      {history.length > 0 && (
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Recent:
          {history.slice(-5).reverse().map((h, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSearchTerm(h);
                setSuggestions([]);
              }}
              className="mx-1 underline text-blue-600 hover:text-blue-400"
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* English Definition */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">📘 English Definition</h2>
        <p className="text-2xl font-bold text-indigo-600">{word}</p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">{definition}</p>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={translateAll}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
          >
            Translate Selected Languages
          </button>
          <button
            onClick={speak}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            🔊 Listen
          </button>
        </div>
      </div>

      {/* Language Selectors */}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Select Languages</h2>
        <div className="flex flex-wrap gap-2">
          {['es', 'fr', 'de', 'hi', 'zh'].map((lang) => (
            <label key={lang} className="text-sm cursor-pointer">
              <input
                type="checkbox"
                value={lang}
                checked={selectedLanguages.includes(lang)}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedLanguages((prev) =>
                    prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val]
                  );
                }}
                className="mr-1"
              />
              {lang.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {/* Translations */}
      {multiTranslations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {multiTranslations.map((t) => (
            <div key={t.language} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-sm font-semibold text-indigo-600 uppercase mb-1">
                {t.language}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">{t.translatedText}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full History */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mt-8">
        <h2 className="text-xl font-semibold mb-2">Search History</h2>
        <ul className="list-disc pl-6 text-gray-800 dark:text-gray-200">
          {history.length === 0 ? (
            <li>No search history yet.</li>
          ) : (
            history.map((w, idx) => <li key={idx}>{w}</li>)
          )}
        </ul>
      </div>
    </div>
  );
}
