import React, { useState, useEffect, useRef } from 'react';
import { Coins, Egg as EggIcon, TestTube, LayoutGrid, Info, CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';
import { ViewState, Animal, Egg, Rarity, EggTier } from './types';
import { Button } from './components/Button';
import { AnimalCard } from './components/AnimalCard';
import { generateAnimalMetadata, generateAnimalImage } from './services/geminiService';

// Constants
const STARTING_BALANCE = 25000;
const YIELD_TICK_RATE = 5000;
const BREEDING_COST = 5000;

const EGG_TYPES = [
  { id: EggTier.BASIC, name: 'Basic Egg', price: 2000, description: 'High chance of Common/Rare', color: 'text-slate-200', border: 'border-slate-500', bg: 'bg-slate-500/20' },
  { id: EggTier.SILVER, name: 'Silver Egg', price: 8000, description: 'Better odds for Rare/Epic', color: 'text-cyan-200', border: 'border-cyan-500', bg: 'bg-cyan-500/20' },
  { id: EggTier.GOLD, name: 'Gold Egg', price: 25000, description: 'High chance of Epic/Legendary', color: 'text-amber-200', border: 'border-amber-500', bg: 'bg-amber-500/20' },
  { id: EggTier.DIAMOND, name: 'Diamond Egg', price: 100000, description: 'Only for the elite. Mythical awaits.', color: 'text-indigo-200', border: 'border-indigo-500', bg: 'bg-indigo-500/20' },
];

export default function App() {
  const [view, setView] = useState<ViewState>('ZOO');
  
  // Game State
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [accumulatedYield, setAccumulatedYield] = useState(0);

  // Interaction State
  const [hatchingEggId, setHatchingEggId] = useState<string | null>(null);
  const [hatchProgress, setHatchProgress] = useState(0);
  
  const [breedingPair, setBreedingPair] = useState<[Animal | null, Animal | null]>([null, null]);
  const [showBreedingConfirm, setShowBreedingConfirm] = useState(false);
  const [isBreeding, setIsBreeding] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Derived State
  const totalDailyYield = animals.reduce((sum, animal) => sum + animal.dailyYield, 0);

  // --- Yield System ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (animals.length === 0) return;
      const tickYield = Math.floor(totalDailyYield * 0.05); // Faster yield for demo
      if (tickYield > 0) {
        setAccumulatedYield(prev => prev + tickYield);
        setBalance(prev => prev + tickYield);
      }
    }, YIELD_TICK_RATE);
    return () => clearInterval(timer);
  }, [animals, totalDailyYield]);

  // --- Actions ---

  const buyEgg = (tier: EggTier, price: number) => {
    if (balance < price) {
      setError(`Insufficient $ZOO! Need ${price.toLocaleString()}`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    setBalance(prev => prev - price);
    const newEgg: Egg = {
      id: crypto.randomUUID(),
      tier: tier,
      purchasePrice: price,
      isHatching: false,
      purchaseDate: Date.now()
    };
    setEggs(prev => [...prev, newEgg]);
    setView('ZOO');
  };

  const hatchEgg = async (egg: Egg) => {
    setHatchingEggId(egg.id);
    setHatchProgress(0);

    // Simulate progress visual before API call completes
    const progressInterval = setInterval(() => {
      setHatchProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      // 1. Generate Metadata
      const metadata = await generateAnimalMetadata(egg.tier);
      
      // 2. Generate Image
      const imageUrl = await generateAnimalImage(metadata.visualPrompt, metadata.rarity);

      setHatchProgress(100);
      clearInterval(progressInterval);

      // Small delay to show 100%
      await new Promise(r => setTimeout(r, 500));

      const newAnimal: Animal = {
        id: crypto.randomUUID(),
        name: metadata.name,
        description: metadata.description,
        rarity: metadata.rarity,
        dailyYield: metadata.dailyYield,
        marketValue: metadata.marketValue,
        imageUrl: imageUrl,
        isHybrid: false,
        hatchedAt: Date.now(),
        traits: metadata.traits.map(t => ({...t, max: 100}))
      };

      setAnimals(prev => [newAnimal, ...prev]);
      setEggs(prev => prev.filter(e => e.id !== egg.id));
    } catch (err) {
      console.error(err);
      setError("Hatching failed. API Error.");
      setHatchingEggId(null);
    } finally {
      clearInterval(progressInterval);
      setHatchingEggId(null);
      setHatchProgress(0);
    }
  };

  const toggleBreedingSelection = (animal: Animal) => {
    setBreedingPair(prev => {
      const [first, second] = prev;
      if (first?.id === animal.id) return [null, second];
      if (second?.id === animal.id) return [first, null];
      if (!first) return [animal, second];
      if (!second) return [first, animal];
      return prev;
    });
  };

  const initiateBreed = () => {
    const [p1, p2] = breedingPair;
    if (!p1 || !p2) return;
    setShowBreedingConfirm(true);
  }

  const confirmBreed = async () => {
    const [p1, p2] = breedingPair;
    if (!p1 || !p2) return;
    
    if (balance < BREEDING_COST) {
      setError(`Need ${BREEDING_COST} $ZOO to breed!`);
      setShowBreedingConfirm(false);
      return;
    }

    setShowBreedingConfirm(false);
    setIsBreeding(true);
    setBalance(prev => prev - BREEDING_COST);

    try {
      // Using Gold tier context for hybrids as they are special
      const metadata = await generateAnimalMetadata(EggTier.GOLD, p1.name, p2.name);
      const imageUrl = await generateAnimalImage(metadata.visualPrompt, metadata.rarity);

      const hybrid: Animal = {
        id: crypto.randomUUID(),
        name: metadata.name,
        description: metadata.description,
        rarity: metadata.rarity,
        dailyYield: metadata.dailyYield,
        marketValue: metadata.marketValue,
        imageUrl: imageUrl,
        isHybrid: true,
        parents: [p1.name, p2.name],
        hatchedAt: Date.now(),
        traits: metadata.traits.map(t => ({...t, max: 100}))
      };

      setAnimals(prev => [hybrid, ...prev]);
      setBreedingPair([null, null]);
      setView('ZOO');
    } catch (err) {
      console.error(err);
      setError("Breeding failed.");
      setBalance(prev => prev + BREEDING_COST);
    } finally {
      setIsBreeding(false);
    }
  };

  // --- Render Helpers ---

  const renderMarket = () => (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          NFT Egg Marketplace
        </h2>
        <p className="text-xl text-slate-400">Buy eggs to mint unique AI-generated creatures.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {EGG_TYPES.map(type => (
          <div key={type.id} className={`glass-panel p-6 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 hover:shadow-2xl border-t-4 ${type.border}`}>
             <div className="w-40 h-40 relative">
               <div className={`absolute inset-0 blur-2xl rounded-full opacity-30 ${type.bg.replace('/20', '')}`}></div>
               <img 
                 src={`https://api.dicebear.com/9.x/glass/svg?seed=${type.id}&backgroundColor=transparent`} 
                 alt={type.name} 
                 className="w-full h-full object-contain relative z-10 drop-shadow-xl" 
               />
             </div>
             
             <div className="text-center">
               <h3 className={`text-2xl font-bold ${type.color}`}>{type.name}</h3>
               <p className="text-xs text-slate-400 mt-2 h-8">{type.description}</p>
             </div>

             <div className="mt-auto w-full space-y-3">
               <div className="flex justify-center items-center gap-2 font-mono text-lg text-white bg-black/30 py-2 rounded">
                 <Coins size={16} className="text-emerald-400" />
                 {type.price.toLocaleString()}
               </div>
               <Button 
                  onClick={() => buyEgg(type.id, type.price)} 
                  disabled={balance < type.price} 
                  className="w-full"
                  variant={type.id === EggTier.DIAMOND ? 'primary' : 'secondary'}
                >
                 Buy
               </Button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderZoo = () => (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      {animals.length === 0 && eggs.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <div className="text-6xl mb-4">🕸️</div>
          <h3 className="text-2xl font-bold">Your Wallet is Empty</h3>
          <p className="mt-2 mb-6">Invest in eggs to start earning yield!</p>
          <Button onClick={() => setView('MARKET')}>Go to Market</Button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Eggs Section */}
          {eggs.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <EggIcon className="text-emerald-400" /> 
                Inventory: Eggs ({eggs.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {eggs.map(egg => (
                  <div key={egg.id} className="glass-panel p-6 rounded-xl text-center space-y-4 group relative overflow-hidden">
                    {/* Hatching Overlay */}
                    {hatchingEggId === egg.id && (
                       <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-4">
                         <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                           <div className="h-full bg-emerald-500 transition-all duration-300" style={{width: `${hatchProgress}%`}}></div>
                         </div>
                         <span className="text-xs font-mono text-emerald-400 animate-pulse">MINTING NFT... {Math.floor(hatchProgress)}%</span>
                       </div>
                    )}

                    <div className={`w-24 h-24 mx-auto ${hatchingEggId === egg.id ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`}>
                      <img src={`https://api.dicebear.com/9.x/glass/svg?seed=${egg.tier}&backgroundColor=transparent`} alt="Egg" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{egg.tier} Egg</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">Unhatched</div>
                    </div>
                    <Button 
                      onClick={() => hatchEgg(egg)} 
                      isLoading={hatchingEggId === egg.id}
                      disabled={hatchingEggId !== null}
                      className="w-full text-sm"
                    >
                      Hatch
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Animals Section */}
          {animals.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <LayoutGrid className="text-cyan-400" /> 
                Inventory: NFTs ({animals.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {animals.map(animal => (
                  <AnimalCard key={animal.id} animal={animal} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLab = () => {
    const [p1, p2] = breedingPair;
    const canBreed = p1 && p2;

    return (
      <div className="max-w-6xl mx-auto animate-in zoom-in-95 duration-300 relative">
        {/* Breeding Confirmation Modal */}
        {showBreedingConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-90">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" />
                Confirm Breeding
              </h3>
              <p className="text-slate-400 mb-6">
                Are you sure you want to breed <span className="text-white font-bold">{p1?.name}</span> and <span className="text-white font-bold">{p2?.name}</span>?
                <br/><br/>
                This will cost <span className="text-emerald-400 font-mono font-bold">{BREEDING_COST} $ZOO</span>.
                The parents will remain in your inventory.
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setShowBreedingConfirm(false)} className="flex-1">Cancel</Button>
                <Button variant="primary" onClick={confirmBreed} className="flex-1">Confirm & Mint</Button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
            Hybrid Breeding Lab
          </h2>
          <p className="text-slate-400">Fuse two NFTs to create a new, potentially rare offspring.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center mb-12">
          {/* Slot 1 */}
          <div className={`aspect-square rounded-2xl border-2 border-dashed ${p1 ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50'} flex items-center justify-center relative overflow-hidden transition-all`}>
            {p1 ? (
              <>
                 <img src={p1.imageUrl} className="w-full h-full object-cover" alt="Parent 1" />
                 <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-center text-xs font-bold">{p1.name}</div>
                 <button onClick={() => setBreedingPair([null, p2])} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500 transition-colors"><X size={16}/></button>
              </>
            ) : (
              <span className="text-slate-600 font-bold">Select Parent 1</span>
            )}
          </div>

          {/* Action Center */}
          <div className="flex flex-col items-center gap-4">
             <div className="p-4 rounded-full bg-slate-800 border border-slate-700 shadow-lg shadow-purple-900/20">
               <TestTube size={32} className={`${isBreeding ? 'animate-pulse text-purple-400' : 'text-slate-500'}`} />
             </div>
             <div className="bg-slate-900 px-6 py-2 rounded-full border border-slate-700 font-mono text-purple-300 text-lg">
               -{BREEDING_COST} $ZOO
             </div>
             <Button 
               onClick={initiateBreed} 
               disabled={!canBreed || isBreeding || balance < BREEDING_COST}
               isLoading={isBreeding}
               className="px-8 py-4 text-xl shadow-lg shadow-purple-500/20"
               variant="primary"
             >
               MINT HYBRID
             </Button>
          </div>

          {/* Slot 2 */}
          <div className={`aspect-square rounded-2xl border-2 border-dashed ${p2 ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 bg-slate-800/50'} flex items-center justify-center relative overflow-hidden transition-all`}>
             {p2 ? (
              <>
                 <img src={p2.imageUrl} className="w-full h-full object-cover" alt="Parent 2" />
                 <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-center text-xs font-bold">{p2.name}</div>
                 <button onClick={() => setBreedingPair([p1, null])} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500 transition-colors"><X size={16}/></button>
              </>
            ) : (
              <span className="text-slate-600 font-bold">Select Parent 2</span>
            )}
          </div>
        </div>

        {/* Selection Grid */}
        <div className="border-t border-slate-800 pt-8">
          <h3 className="text-xl font-bold mb-6 text-slate-300">Select Parents from Wallet</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {animals.map(animal => {
              const isSelected = p1?.id === animal.id || p2?.id === animal.id;
              return (
                <AnimalCard 
                  key={animal.id} 
                  animal={animal} 
                  selected={isSelected}
                  disabled={isSelected && (!!p1 && !!p2)}
                  onSelect={toggleBreedingSelection}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/20">
               Z
             </div>
             <span className="font-bold text-2xl tracking-tight hidden sm:block">Crypto<span className="text-emerald-400">Zoo</span></span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Wallet</span>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xl font-bold neon-text">
                <Coins size={20} />
                {Math.floor(balance).toLocaleString()}
                {accumulatedYield > 0 && (
                   <span className="text-xs text-emerald-600 animate-fade-out-up">+{accumulatedYield}</span>
                )}
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-700"></div>

            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Yield/Day</span>
              <div className="font-mono text-white font-bold">
                 {totalDailyYield.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="my-8 flex justify-center gap-4">
         {[
           { id: 'MARKET', icon: Coins, label: 'Market' },
           { id: 'ZOO', icon: LayoutGrid, label: 'My Wallet' },
           { id: 'LAB', icon: TestTube, label: 'Breeding Lab' },
         ].map(item => (
           <button
             key={item.id}
             onClick={() => setView(item.id as ViewState)}
             className={`
               flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all
               ${view === item.id 
                 ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' 
                 : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}
             `}
           >
             <item.icon size={18} />
             {item.label}
           </button>
         ))}
      </nav>

      {/* Main Content */}
      <main className="px-4">
        {error && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-red-500/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 font-bold">
               <AlertTriangle size={20} />
               {error}
            </div>
          </div>
        )}
        
        {view === 'MARKET' && renderMarket()}
        {view === 'ZOO' && renderZoo()}
        {view === 'LAB' && renderLab()}
      </main>
      
      {/* Footer Info */}
      <div className="fixed bottom-4 right-4 max-w-sm z-0 hidden lg:block">
        <div className="glass-panel p-4 rounded-xl text-xs text-slate-500">
           <p className="font-bold text-slate-400 mb-1">Simulated Blockchain Network</p>
           <p>• Yields accrue every 5 seconds</p>
           <p>• All assets are AI generated on-chain (simulated)</p>
        </div>
      </div>
    </div>
  );
}