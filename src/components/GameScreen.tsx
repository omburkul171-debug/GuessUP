import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, RotateCcw, Bot, User, Trophy, Sparkles, Zap } from 'lucide-react';
import { UserProfile, GameSession, GuessEntry } from '../types';
import { db, doc, updateDoc, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import confetti from 'canvas-confetti';

interface GameScreenProps {
  game: GameSession;
  profile: UserProfile;
  onBack: () => void;
}

export default function GameScreen({ game, profile, onBack }: GameScreenProps) {
  const [userSecret, setUserSecret] = useState<number | null>(null);
  const [userGuess, setUserGuess] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPlayer1 = profile.uid === game.player1;
  const opponentName = isPlayer1 ? (game.player2Name || 'Opponent') : game.player1Name;
  const myTurn = game.turn === profile.uid;
  const mySecret = isPlayer1 ? game.player1Secret : game.player2Secret;
  const opponentSecret = isPlayer1 ? game.player2Secret : game.player1Secret;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [game.history]);

  useEffect(() => {
    if (game.status === 'finished' && game.winner === profile.uid) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#10b981']
      });
    }
  }, [game.status, game.winner, profile.uid]);

  const setSecret = async () => {
    if (userSecret === null || userSecret < 0 || userSecret > game.range) return;
    try {
      const update: any = isPlayer1 ? { player1Secret: userSecret } : { player2Secret: userSecret };
      
      // If both secrets are set, start playing
      const gameRef = doc(db, 'games', game.id);
      const currentSecret = isPlayer1 ? game.player2Secret : game.player1Secret;
      
      if (currentSecret !== undefined) {
        update.status = 'playing';
        update.turn = game.player1; // Player 1 always starts
      }
      
      await updateDoc(gameRef, update);
    } catch (err) {
      setError('Failed to set secret.');
    }
  };

  const handleGuess = async () => {
    const guess = parseInt(userGuess);
    if (isNaN(guess) || guess < 0 || guess > game.range || !myTurn) return;

    try {
      let hint: GuessEntry['hint'] = 'Correct';
      if (guess < opponentSecret!) hint = 'Higher';
      else if (guess > opponentSecret!) hint = 'Lower';

      const entry: GuessEntry = {
        uid: profile.uid,
        guess,
        hint,
        timestamp: Date.now(),
      };

      const newHistory = [...game.history, entry];
      const update: any = {
        history: newHistory,
        turn: isPlayer1 ? game.player2 : game.player1,
      };

      if (hint === 'Correct') {
        update.status = 'finished';
        update.winner = profile.uid;
      }

      await updateDoc(doc(db, 'games', game.id), update);
      setUserGuess('');
    } catch (err) {
      setError('Failed to submit guess.');
    }
  };

  return (
    <div className="flex flex-col h-full flex-1">
      <AnimatePresence mode="wait">
        {game.status === 'selecting' && mySecret === undefined ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8 bg-white/10 p-8 rounded-[3rem] border border-white/10"
          >
            <div className="text-center">
              <h3 className="text-3xl font-black mb-2 italic">Set Your Secret</h3>
              <p className="text-indigo-200">Pick a number between 0 and {game.range}</p>
            </div>

            <div className="relative w-full max-w-[200px]">
              <input
                type="number"
                placeholder="0"
                className="w-full bg-white text-indigo-600 text-6xl font-black text-center py-8 rounded-3xl shadow-2xl focus:outline-none focus:ring-4 ring-pink-500/50 transition-all"
                onChange={(e) => setUserSecret(parseInt(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && setSecret()}
              />
            </div>

            <button
              onClick={setSecret}
              disabled={userSecret === null || userSecret < 0 || userSecret > game.range}
              className="w-full bg-pink-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              CONFIRM NUMBER
            </button>
          </motion.div>
        ) : game.status === 'selecting' ? (
          <motion.div
            key="waiting-opponent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-6 py-12 text-center"
          >
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
              <Zap className="w-12 h-12 text-pink-400" />
            </div>
            <h3 className="text-2xl font-black italic">Waiting for {opponentName}...</h3>
            <p className="text-indigo-200">They are still picking their secret number.</p>
          </motion.div>
        ) : (game.status === 'playing' || game.status === 'finished') ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full flex-1 gap-4"
          >
            {/* Player Avatars */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/5">
              <div className={`flex flex-col items-center gap-2 transition-opacity ${!myTurn && game.status === 'playing' ? 'opacity-50' : 'opacity-100'}`}>
                <div className={`w-16 h-16 rounded-2xl bg-pink-500 flex items-center justify-center border-4 ${myTurn && game.status === 'playing' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}>
                  <User className="w-8 h-8" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest">You</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-black italic tracking-tighter uppercase">VS</div>
                <div className="mt-2 text-pink-400 font-black text-xl animate-pulse">
                  {game.status === 'finished' ? 'GAME OVER' : myTurn ? 'YOUR TURN' : 'THEIR TURN'}
                </div>
              </div>

              <div className={`flex flex-col items-center gap-2 transition-opacity ${myTurn && game.status === 'playing' ? 'opacity-50' : 'opacity-100'}`}>
                <div className={`w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center border-4 ${!myTurn && game.status === 'playing' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}>
                  <User className="w-8 h-8" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest truncate max-w-[80px]">{opponentName}</span>
              </div>
            </div>

            {/* History Area */}
            <div 
              ref={scrollRef}
              className="flex-1 bg-white/5 rounded-[2rem] p-4 overflow-y-auto flex flex-col gap-3 max-h-[300px] scroll-smooth border border-white/5"
            >
              {game.history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-indigo-300 italic text-sm">
                  The battle has begun! Make your first guess.
                </div>
              ) : (
                game.history.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: entry.uid !== profile.uid ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex flex-col ${entry.uid !== profile.uid ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl font-bold flex flex-col ${
                      entry.uid !== profile.uid ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-white text-indigo-600 rounded-tl-none'
                    }`}>
                      <span className="text-xs opacity-70 mb-1 uppercase tracking-widest">
                        {entry.uid !== profile.uid ? opponentName : 'You'} guessed
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
            {game.status === 'playing' && (
              <div className="flex gap-3 mt-auto">
                <input
                  type="number"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  disabled={!myTurn}
                  placeholder={`Guess (0-${game.range})`}
                  className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 font-bold text-xl focus:outline-none focus:bg-white/20 transition-all disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                />
                <button
                  onClick={handleGuess}
                  disabled={!myTurn || !userGuess}
                  className="bg-pink-500 p-4 rounded-2xl shadow-lg hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            )}

            {game.status === 'finished' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-4 py-4 bg-white/10 rounded-[2rem] border border-white/10"
              >
                <Trophy className={`w-16 h-16 ${game.winner === profile.uid ? 'text-yellow-400' : 'text-indigo-300'}`} />
                <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                    {game.winner === profile.uid ? 'YOU WON!' : 'YOU LOST!'}
                  </h2>
                  <p className="text-indigo-200 text-sm font-medium">
                    The secret number was <span className="text-white font-black">{isPlayer1 ? game.player2Secret : game.player1Secret}</span>
                  </p>
                </div>
                <button
                  onClick={onBack}
                  className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-black hover:bg-indigo-50 transition-all active:scale-95"
                >
                  BACK TO LOBBY
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
