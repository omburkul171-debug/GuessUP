import { useState, useEffect } from 'react';
import { db, doc, setDoc, getDoc } from './firebase';
import { UserProfile } from './types';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import PracticeMode from './components/PracticeMode';
import MultiplayerMode from './components/MultiplayerMode';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, User as UserIcon, Settings, Home, Sparkles } from 'lucide-react';

// Helper to get or create a guest ID
const getGuestId = () => {
  let id = localStorage.getItem('guessup_guest_id');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('guessup_guest_id', id);
  }
  return id;
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'menu' | 'practice' | 'multiplayer' | 'game' | 'leaderboard' | 'profile'>('menu');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initProfile = async () => {
      const uid = getGuestId();
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: uid,
          displayName: 'Guest ' + uid.slice(-4),
          points: 0,
          gamesPlayed: 0,
          gamesWon: 0,
        };
        await setDoc(doc(db, 'users', uid), newProfile);
        setProfile(newProfile);
      }
      setLoading(false);
    };

    initProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-600 text-white font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md mx-auto min-h-screen relative flex flex-col"
        >
          {/* Header */}
          <header className="p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center shadow-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Player</p>
                <p className="font-bold leading-tight">{profile?.displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500/50 px-3 py-1 rounded-full flex items-center gap-2 border border-indigo-400/30">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="font-bold">{profile?.points}</span>
              </div>
              <div className="p-2 bg-indigo-500/30 rounded-full">
                <Sparkles className="w-5 h-5 text-indigo-200" />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 px-6 pb-24">
            {view === 'menu' && <MainMenu setView={setView} />}
            {view === 'practice' && <PracticeMode onBack={() => setView('menu')} profile={profile!} />}
            {view === 'multiplayer' && <MultiplayerMode onBack={() => setView('menu')} profile={profile!} setView={setView} />}
            {view === 'leaderboard' && <div className="text-center py-10">Leaderboard coming soon!</div>}
            {view === 'profile' && <div className="text-center py-10">Profile stats coming soon!</div>}
          </main>

          {/* Navigation Bar */}
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-2 flex justify-around items-center shadow-2xl">
            <button 
              onClick={() => setView('menu')}
              className={`p-3 rounded-2xl transition-all ${view === 'menu' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
            >
              <Home className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setView('leaderboard')}
              className={`p-3 rounded-2xl transition-all ${view === 'leaderboard' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
            >
              <Trophy className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setView('profile')}
              className={`p-3 rounded-2xl transition-all ${view === 'profile' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
            >
              <UserIcon className="w-6 h-6" />
            </button>
          </nav>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
