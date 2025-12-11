import React from 'react';
import { Animal, Rarity } from '../types';
import { Coins, Sparkles, Activity, DollarSign, TrendingUp } from 'lucide-react';

interface AnimalCardProps {
  animal: Animal;
  onSelect?: (animal: Animal) => void;
  selected?: boolean;
  actionLabel?: string;
  disabled?: boolean;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ 
  animal, 
  onSelect, 
  selected, 
  actionLabel,
  disabled 
}) => {
  const rarityColors = {
    [Rarity.COMMON]: 'text-slate-400 border-slate-600 shadow-slate-900/50',
    [Rarity.RARE]: 'text-cyan-400 border-cyan-500/50 shadow-cyan-500/20',
    [Rarity.EPIC]: 'text-purple-400 border-purple-500/50 shadow-purple-500/30',
    [Rarity.LEGENDARY]: 'text-amber-400 border-amber-500/50 shadow-amber-500/40',
    [Rarity.MYTHICAL]: 'text-rose-400 border-rose-500/50 shadow-rose-500/50',
  };

  const bgGradients = {
    [Rarity.COMMON]: 'from-slate-800 to-slate-900',
    [Rarity.RARE]: 'from-slate-800 to-cyan-900/20',
    [Rarity.EPIC]: 'from-slate-800 to-purple-900/20',
    [Rarity.LEGENDARY]: 'from-slate-800 to-amber-900/20',
    [Rarity.MYTHICAL]: 'from-slate-800 to-rose-900/20',
  };

  return (
    <div 
      className={`
        relative group rounded-xl overflow-hidden border transition-all duration-300
        ${rarityColors[animal.rarity]} 
        ${selected ? 'ring-2 ring-emerald-400 scale-[1.02]' : 'hover:-translate-y-2 hover:shadow-2xl'}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
        bg-gradient-to-b ${bgGradients[animal.rarity]}
        flex flex-col h-full
      `}
      onClick={() => !disabled && onSelect && onSelect(animal)}
    >
      {/* Image Container */}
      <div className="aspect-square w-full overflow-hidden bg-slate-900 relative">
        <img 
          src={animal.imageUrl} 
          alt={animal.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold bg-black/80 backdrop-blur-sm border border-white/10 uppercase tracking-wider ${rarityColors[animal.rarity].split(' ')[0]}`}>
          {animal.rarity}
        </div>
        {animal.isHybrid && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/80 text-black backdrop-blur-sm shadow-lg shadow-emerald-500/50">
             HYBRID
            </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <h3 className="text-lg font-bold leading-tight truncate">{animal.name}</h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[2.5em]">{animal.description}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/50 p-2 rounded border border-white/5">
            <div className="flex items-center gap-1 text-emerald-400 mb-1">
              <Coins size={12} />
              <span className="font-semibold">YIELD</span>
            </div>
            <div className="font-mono text-white text-xs">{animal.dailyYield.toLocaleString()} / day</div>
          </div>
          
          <div className="bg-slate-900/50 p-2 rounded border border-white/5">
             <div className="flex items-center gap-1 text-amber-400 mb-1">
              <TrendingUp size={12} />
              <span className="font-semibold">VALUE</span>
            </div>
            <div className="font-mono text-white text-xs">${animal.marketValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Traits */}
        {animal.traits && animal.traits.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/5">
             {animal.traits.slice(0, 3).map((trait, idx) => (
               <div key={idx} className="flex items-center gap-2 text-[10px]">
                 <span className="text-slate-400 w-16 truncate">{trait.name}</span>
                 <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                     style={{ width: `${Math.min(trait.value, 100)}%` }}
                   />
                 </div>
                 <span className="text-white font-mono w-6 text-right">{trait.value}</span>
               </div>
             ))}
          </div>
        )}
      </div>
      
      {/* Action Overlay */}
      {selected && (
        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[1px] z-10">
           <div className="bg-emerald-500 text-black font-bold px-4 py-2 rounded-full shadow-lg transform scale-100 animate-in fade-in zoom-in duration-200">
             SELECTED
           </div>
        </div>
      )}
    </div>
  );
};