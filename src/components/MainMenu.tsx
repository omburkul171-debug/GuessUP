import { motion } from 'motion/react';
import { Play, Users, Bot, Trophy, User } from 'lucide-react';

interface MainMenuProps {
  setView: (view: 'menu' | 'practice' | 'multiplayer' | 'game' | 'leaderboard' | 'profile') => void;
}

export default function MainMenu({ setView }: MainMenuProps) {
  const menuItems = [
    { id: 'multiplayer', label: 'Play Online', icon: Play, color: 'bg-pink-500', description: 'Match with a random player' },
    { id: 'multiplayer', label: 'Play with Friend', icon: Users, color: 'bg-blue-500', description: 'Invite via code or link' },
    { id: 'practice', label: 'Practice Mode', icon: Bot, color: 'bg-emerald-500', description: 'Play against AI opponent' },
  ];

  return (
    <div className="flex flex-col gap-4 mt-4">
      {menuItems.map((item, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => setView(item.id as any)}
          className="group relative flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-3xl transition-all active:scale-95 text-left overflow-hidden"
        >
          <div className={`${item.color} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
            <item.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{item.label}</h3>
            <p className="text-sm text-indigo-200">{item.description}</p>
          </div>
          <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 fill-current" />
          </div>
        </motion.button>
      ))}

      <div className="grid grid-cols-2 gap-4 mt-4">
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => setView('leaderboard')}
          className="flex flex-col items-center gap-2 p-6 bg-indigo-500/30 border border-indigo-400/20 rounded-3xl hover:bg-indigo-500/40 transition-all"
        >
          <Trophy className="w-8 h-8 text-yellow-400" />
          <span className="font-bold">Leaderboard</span>
        </motion.button>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => setView('profile')}
          className="flex flex-col items-center gap-2 p-6 bg-indigo-500/30 border border-indigo-400/20 rounded-3xl hover:bg-indigo-500/40 transition-all"
        >
          <User className="w-8 h-8 text-indigo-200" />
          <span className="font-bold">Profile</span>
        </motion.button>
      </div>
    </div>
  );
}
