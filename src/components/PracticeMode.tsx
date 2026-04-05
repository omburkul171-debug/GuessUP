import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, RotateCcw, Bot, User, Trophy, Sparkles } from 'lucide-react';
import { UserProfile, GuessEntry } from '../types';
import confetti from 'canvas-confetti';

interface PracticeModeProps {
  onBack: () => void;
  profile: UserProfile;
}

type GamePhase = 'difficulty' | 'selection' | 'playing' | 'results';

export default function PracticeMode({ onBack, profile }: PracticeModeProps) {
  const [phase, setPhase] = useState<GamePhase>('difficulty');
  const [difficulty, setDifficulty] = useState<{ label: string, range: number }>({ label: 'Medium', range: 100 });
  const [userSecret, setUserSecret] = useState<number | null>(null);
  const [aiSecret, setAiSecret] = useState<number>(0);
  const [userGuess, setUserGuess] = useState<string>('');
  const [history, setHistory] = useState<GuessEntry[]>([]);
  const [turn, setTurn] = useState<'user' | 'ai'>('user');
  const [winner, setWinner] = useState<'user' | 'ai' | null>(null);
  const [aiRange, setAiRange] = useState({ min: 0, max: 100 });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const startSelection = (diff: { label: string, range: number }) => {
    setDifficulty(diff);
    setAiSecret(Math.floor(Math.random() * (diff.range + 1)));
    setAiRange({ min: 0, max: diff.range });
    setPhase('selection');
  };

  const startGame = (secret: number) => {
    setUserSecret(secret);
    setPhase('playing');
    setTurn('user');
  };

  const handleUserGuess = () => {
    const guess = parseInt(userGuess);
    if (isNaN(guess) || guess < 0 || guess > difficulty.range) return;

    let hint: GuessEntry['hint'] = 'Correct';
    if (guess < aiSecret) hint = 'Higher';
    else if (guess > aiSecret) hint = 'Lower';

    const entry: GuessEntry = {
      uid: profile.uid,
      guess,
      hint,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, entry]);
    setUserGuess('');

    if (hint === 'Correct') {
      setWinner('user');
      setPhase('results');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#10b981']
      });
    } else {
      setTurn('ai');
      setTimeout(handleAiTurn, 1500);
    }
  };

  const handleAiTurn = () => {
    // AI uses binary search logic but with a bit of randomness
    const { min, max } = aiRange;
    let guess = Math.floor((min + max) / 2);
    
    // Add some "human-like" error or variety
    if (Math.random() > 0.8) {
      guess = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let hint: GuessEntry['hint'] = 'Correct';
    if (guess < userSecret!) {
      hint = 'Higher';
      setAiRange(prev => ({ ...prev, min: guess + 1 }));
    } else if (guess > userSecret!) {
      hint = 'Lower';
      setAiRange(prev => ({ ...prev, max: guess - 1 }));
    }

    const entry: GuessEntry = {
      uid: 'ai',
      guess,
      hint,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, entry]);

    if (hint === 'Correct') {
      setWinner('ai');
      setPhase('results');
    } else {
      setTurn('user');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[70vh]">
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-black italic tracking-tight">Practice Mode</h2>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'difficulty' && (
          <motion.div
            key="difficulty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-4"
          >
            <p className="text-indigo-200 font-bold uppercase tracking-widest text-sm text-center mb-2">Select Difficulty</p>
            {[
              { label: 'Easy', range: 50, color: 'bg-emerald-500' },
              { label: 'Medium', range: 100, color: 'bg-blue-500' },
              { label: 'Hard', range: 500, color: 'bg-pink-500' },
            ].map((diff) => (
              <button
                key={diff.label}
                onClick={() => startSelection(diff)}
                className="flex items-center justify-between p-6 bg-white/10 border border-white/10 rounded-3xl hover:bg-white/20 transition-all group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-black">{diff.label}</span>
                  <span className="text-indigo-200 font-medium text-sm">Range: 0 - {diff.range}</span>
                </div>
                <div className={`${diff.color} w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <PlayIcon className="w-6 h-6 text-white fill-current" />
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {phase === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8 bg-white/10 p-8 rounded-[3rem] border border-white/10"
          >
            <div className="text-center">
              <h3 className="text-3xl font-black mb-2 italic">Set Your Secret</h3>
              <p className="text-indigo-200">Pick a number between 0 and {difficulty.range}</p>
            </div>

            <div className="relative w-full max-w-[200px]">
              <input
                type="number"
                placeholder="0"
                className="w-full bg-white text-indigo-600 text-6xl font-black text-center py-8 rounded-3xl shadow-2xl focus:outline-none focus:ring-4 ring-pink-500/50 transition-all"
                onChange={(e) => setUserSecret(parseInt(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && userSecret !== null && startGame(userSecret)}
              />
            </div>

            <button
              onClick={() => userSecret !== null && startGame(userSecret)}
              disabled={userSecret === null || userSecret < 0 || userSecret > difficulty.range}
              className="w-full bg-pink-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              CONFIRM NUMBER
            </button>
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full flex-1 gap-4"
          >
            {/* Player Avatars */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/5">
              <div className={`flex flex-col items-center gap-2 transition-opacity ${turn === 'ai' ? 'opacity-50' : 'opacity-100'}`}>
                <div className={`w-16 h-16 rounded-2xl bg-pink-500 flex items-center justify-center border-4 ${turn === 'user' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}>
                  <User className="w-8 h-8" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest">You</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-black italic tracking-tighter uppercase">VS</div>
                <div className="mt-2 text-pink-400 font-black text-xl animate-pulse">
                  {turn === 'user' ? 'YOUR TURN' : 'AI THINKING...'}
                </div>
              </div>

              <div className={`flex flex-col items-center gap-2 transition-opacity ${turn === 'user' ? 'opacity-50' : 'opacity-100'}`}>
                <div className={`w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center border-4 ${turn === 'ai' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}>
                  <Bot className="w-8 h-8" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest">AI Bot</span>
              </div>
            </div>

            {/* History Area */}
            <div 
              ref={scrollRef}
              className="flex-1 bg-white/5 rounded-[2rem] p-4 overflow-y-auto flex flex-col gap-3 max-h-[300px] scroll-smooth border border-white/5"
            >
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-indigo-300 italic text-sm">
                  The battle has begun! Make your first guess.
                </div>
              ) : (
                history.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: entry.uid === 'ai' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex flex-col ${entry.uid === 'ai' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl font-bold flex flex-col ${
                      entry.uid === 'ai' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-white text-indigo-600 rounded-tl-none'
                    }`}>
                      <span className="text-xs opacity-70 mb-1 uppercase tracking-widest">
                        {entry.uid === 'ai' ? 'AI Bot' : 'You'} guessed
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black">{entry.guess}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-tighter ${
                          entry.hint === 'Correct' ? 'bg-emerald-400 text-white' : 'bg-black/20'
                        }`}>
                          {entry.hint}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-3 mt-auto">
              <input
                type="number"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                disabled={turn === 'ai'}
                placeholder={`Guess (0-${difficulty.range})`}
                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 font-bold text-xl focus:outline-none focus:bg-white/20 transition-all disabled:opacity-50"
                onKeyDown={(e) => e.key === 'Enter' && handleUserGuess()}
              />
              <button
                onClick={handleUserGuess}
                disabled={turn === 'ai' || !userGuess}
                className="bg-pink-500 p-4 rounded-2xl shadow-lg hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-6 py-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"
              />
              {winner === 'user' ? (
                <Trophy className="w-32 h-32 text-yellow-400 relative z-10 drop-shadow-2xl" />
              ) : (
                <Bot className="w-32 h-32 text-indigo-300 relative z-10 drop-shadow-2xl" />
              )}
            </div>

            <div>
              <h2 className="text-5xl font-black italic tracking-tighter mb-2">
                {winner === 'user' ? 'YOU WON!' : 'AI WON!'}
              </h2>
              <p className="text-indigo-200 font-medium">
                {winner === 'user' 
                  ? `Amazing! You guessed the AI's number in ${history.filter(h => h.uid !== 'ai').length} attempts.`
                  : `Better luck next time! The AI was too fast.`}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full mt-4">
              <button
                onClick={() => {
                  setPhase('difficulty');
                  setHistory([]);
                  setWinner(null);
                  setUserSecret(null);
                }}
                className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <RotateCcw className="w-6 h-6" />
                PLAY AGAIN
              </button>
              <button
                onClick={onBack}
                className="w-full bg-indigo-500/50 text-white py-5 rounded-2xl font-black text-xl border border-white/10 hover:bg-indigo-500/70 transition-all active:scale-95"
              >
                BACK TO MENU
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
