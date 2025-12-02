
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Zap, Volume2, VolumeX, Plus, Minus, Info, Settings, History, Menu, Play } from 'lucide-react';

export const Game = () => {
  const { user, spinSlot, claimBonus, setView } = useStore();
  const [betAmount, setBetAmount] = useState<number>(1.00); 
  const [isSpinning, setIsSpinning] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // Para controle de audio
  
  // Estado do Grid (9 posições)
  const [grid, setGrid] = useState<string[]>(Array(9).fill('🐯'));
  const [winningIndices, setWinningIndices] = useState<number[]>([]);
  
  const [winAmount, setWinAmount] = useState(0);
  const [lastWin, setLastWin] = useState(false);
  const [bonusActive, setBonusActive] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Efeito Moedas
  const [coins, setCoins] = useState<Array<{id: number, left: string, delay: string}>>([]);

  // Mapeamento visual Premium
  const symbolMap: Record<string, { bg: string, border: string, icon: string, color: string }> = {
    '🍊': { bg: 'bg-orange-600', border: 'border-orange-400', color: 'text-orange-100', icon: '🍊' },
    '🔔': { bg: 'bg-indigo-600', border: 'border-indigo-400', color: 'text-indigo-100', icon: '🧨' }, 
    '🧧': { bg: 'bg-red-600', border: 'border-red-400', color: 'text-red-100', icon: '🧧' },
    '💰': { bg: 'bg-yellow-600', border: 'border-yellow-400', color: 'text-yellow-100', icon: '💰' },
    '💎': { bg: 'bg-emerald-600', border: 'border-emerald-400', color: 'text-emerald-100', icon: '💎' }, 
    '🐯': { bg: 'bg-gradient-to-br from-yellow-500 to-orange-500', border: 'border-yellow-200', color: 'text-white', icon: '🐯' }
  };

  // Efeitos Sonoros
  // Musica viciante de fundo
  const bgMusic = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3')); 
  const spinSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2044/2044-preview.mp3')); 
  const winSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3')); 
  const bonusSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/1077/1077-preview.mp3'));

  const startGame = () => {
      setGameStarted(true);
      if (soundEnabled) {
          bgMusic.current.loop = true;
          bgMusic.current.volume = 0.4;
          bgMusic.current.play().catch(e => console.log("Audio block", e));
      }
  };

  useEffect(() => {
    if (!soundEnabled) {
        bgMusic.current.pause();
    } else if (gameStarted) {
        bgMusic.current.play().catch(() => {});
    }
  }, [soundEnabled, gameStarted]);

  const triggerCoinRain = () => {
    const newCoins = [];
    for(let i=0; i<30; i++) {
        newCoins.push({
            id: Date.now() + i,
            left: Math.random() * 100 + '%',
            delay: Math.random() * 1 + 's'
        });
    }
    setCoins(newCoins);
    setTimeout(() => setCoins([]), 3000);
  };

  const playSound = (type: 'spin' | 'win' | 'bonus') => {
    if (!soundEnabled) return;
    try {
        if (type === 'spin') {
            spinSound.current.currentTime = 0;
            spinSound.current.volume = 0.6;
            spinSound.current.loop = true;
            spinSound.current.play();
        } else if (type === 'win') {
            winSound.current.currentTime = 0;
            winSound.current.volume = 1.0;
            winSound.current.play();
        } else if (type === 'bonus') {
            bonusSound.current.currentTime = 0;
            bonusSound.current.volume = 1.0;
            bonusSound.current.play();
        }
    } catch (e) { console.error("Audio error", e); }
  };

  const stopSpinSound = () => {
      spinSound.current.pause();
      spinSound.current.currentTime = 0;
  };

  const handleSpin = async () => {
    if (isSpinning || bonusActive) return;
    if (betAmount < 1) { setError('Mínimo R$ 1,00'); return; }
    if (!user || user.balance < betAmount) { setError('Saldo insuficiente.'); return; }

    setError('');
    setIsSpinning(true);
    setLastWin(false);
    setWinningIndices([]);
    setWinAmount(0);
    playSound('spin');

    // Efeito visual de giro (shuffle)
    const interval = setInterval(() => {
        setGrid(prev => prev.map(() => ['🍊', '🔔', '🧧', '💰', '💎', '🐯'][Math.floor(Math.random() * 6)]));
    }, 60);

    try {
      const result = await spinSlot(betAmount);
      
      const delay = turboMode ? 400 : 2000;

      setTimeout(() => {
          clearInterval(interval);
          setGrid(result.grid);
          stopSpinSound();
          setIsSpinning(false);

          if (result.win) {
              setLastWin(true);
              setWinAmount(result.amountWon);
              setWinningIndices(result.winningLines);
              playSound('win');
              triggerCoinRain();
          }

          if (result.isBonus) {
              setTimeout(() => {
                  setBonusActive(true);
                  playSound('bonus');
              }, 800);
          }
      }, delay);

    } catch (e: any) {
        clearInterval(interval);
        stopSpinSound();
        setIsSpinning(false);
        setError(e.message || 'Erro no jogo');
    }
  };

  const handleCardClick = () => {
      const bonusPrize = winAmount * 10; 
      claimBonus(bonusPrize);
      setWinAmount(bonusPrize);
      alert(`🐯 TIGRE SOLTOU A CARTA! \n\nMULTIPLICADOR 10X!\n\nVocê ganhou: R$ ${bonusPrize.toFixed(2)}`);
      triggerCoinRain();
      setBonusActive(false);
  };

  const changeBet = (delta: number) => {
      if (isSpinning) return;
      const newBet = betAmount + delta;
      if (newBet >= 1 && newBet <= 500) setBetAmount(newBet);
  };

  return (
    <div className="min-h-screen bg-black flex justify-center items-center font-sans overflow-hidden">
      
      {/* Coin Rain Effect */}
      {coins.map(coin => (
          <div key={coin.id} className="coin" style={{left: coin.left, animationDelay: coin.delay}}>💰</div>
      ))}

      {/* Background Decorativo */}
      <div className="fixed inset-0 bg-gradient-to-b from-red-900 to-black z-0"></div>
      <div className="fixed inset-0 opacity-20 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-600 via-transparent to-transparent"></div>
      
      {/* OVERLAY DE START PARA AUDIO (Mobile Policy) */}
      {!gameStarted && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 animate-fadeIn">
              <div className="text-[5rem] mb-4 animate-bounce">🐯</div>
              <h1 className="text-3xl font-black text-yellow-400 mb-2 brand-font">FORTUNE TIGER</h1>
              <p className="text-gray-400 mb-8 text-center">Clique abaixo para ativar o som e começar</p>
              <button 
                onClick={startGame}
                className="bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 px-10 rounded-full shadow-[0_0_30px_#22c55e] transition-transform hover:scale-105 flex items-center gap-3"
              >
                  <Play fill="black" /> JOGAR AGORA
              </button>
          </div>
      )}

      {/* Game Container Mobile-First */}
      <div className="w-full max-w-[450px] h-full min-h-screen bg-gradient-to-b from-[#4a0404] to-[#1a0101] relative z-10 shadow-2xl flex flex-col">
        
        {/* Navbar In-Game */}
        <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm z-20">
             <button onClick={() => setView('DASHBOARD')} className="text-yellow-500 hover:text-white"><Menu /></button>
             <div className="flex gap-4">
                 <button onClick={() => setSoundEnabled(!soundEnabled)} className={`${soundEnabled ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {soundEnabled ? <Volume2 /> : <VolumeX />}
                 </button>
                 <Settings className="text-gray-400" />
             </div>
        </div>
        
        {/* Faixa Promo no Jogo */}
        <div className="bg-yellow-600/20 py-1 overflow-hidden border-y border-yellow-500/20">
            <div className="animate-marquee whitespace-nowrap text-[10px] text-yellow-300 font-bold uppercase">
                DEPOSITE R$ 10 GANHE R$ 5 • MULTIPLICADOR 10X ATIVO • CARTA DO TIGRE LIBERADA
            </div>
        </div>

        {/* Header do Tigre */}
        <div className="relative flex-1 flex flex-col items-center justify-end pb-4 z-10">
            {/* Brilho atrás do Tigre */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 blur-[50px] rounded-full"></div>
            
            {/* O Tigre (Emoji Grande com Efeitos) */}
            <div className={`text-[8rem] relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transition-transform duration-300 ${isSpinning ? 'scale-110' : 'animate-bounce'}`}>
                🐯
            </div>
            
            {lastWin && (
                <div className="absolute top-20 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black px-6 py-1 rounded-full border-2 border-white shadow-[0_0_20px_#fbbf24] animate-pulse z-20">
                    VITÓRIA!
                </div>
            )}
        </div>

        {/* Área do Jogo (Rolos) */}
        <div className="relative px-4 z-20">
            {/* Telhado do Templo */}
            <div className="h-8 bg-[#0f3d0f] rounded-t-2xl border-t-2 border-yellow-500 relative flex justify-center shadow-lg">
                 <div className="bg-red-800 px-4 rounded-b-lg border-x border-b border-yellow-500/50 text-[10px] text-yellow-400 font-bold tracking-widest uppercase py-1 shadow-md">
                     Fortune Tiger
                 </div>
            </div>

            {/* Grid Container */}
            <div className="bg-[#2a0a0a] border-x-4 border-[#5c1c1c] p-3 shadow-2xl relative">
                <div className="bg-[#1a0505] rounded-lg p-2 grid grid-cols-3 gap-2 border border-yellow-900/30">
                    {grid.map((symbol, i) => {
                        const style = symbolMap[symbol];
                        const isWinner = winningIndices.includes(i);
                        return (
                            <div 
                                key={i} 
                                className={`
                                    aspect-square rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-150
                                    ${style.bg} ${style.border} border-b-4 shadow-lg
                                    ${isWinner ? 'brightness-125 scale-105 z-10 ring-2 ring-yellow-400' : ''}
                                    ${isSpinning ? 'blur-[1px]' : ''}
                                `}
                            >
                                <span className={`text-4xl drop-shadow-md ${isWinner ? 'animate-bounce' : ''}`}>{style.icon}</span>
                                {isWinner && <div className="absolute inset-0 bg-yellow-400/20 mix-blend-overlay animate-pulse"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Base do Templo */}
            <div className="h-4 bg-[#0f3d0f] border-b-2 border-yellow-500 mb-4 shadow-lg relative z-10"></div>
        </div>

        {/* Controles */}
        <div className="bg-[#1f0505] rounded-t-[40px] p-6 pb-8 border-t-2 border-yellow-900/30 relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            
            {/* Barra de Status */}
            <div className="flex justify-between items-center mb-6 bg-black/40 p-3 rounded-2xl border border-white/5">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Saldo</span>
                    <span className="text-white font-mono font-bold text-lg">R$ {user?.balance.toFixed(2)}</span>
                </div>
                <div className="h-8 w-px bg-gray-700"></div>
                <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Ganho</span>
                    <span className="text-yellow-400 font-mono font-bold text-lg">R$ {winAmount.toFixed(2)}</span>
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-between gap-4">
                
                {/* Aposta */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Aposta</span>
                    <div className="flex items-center bg-[#2a0e0e] rounded-full p-1 border border-red-900 shadow-inner">
                        <button onClick={() => changeBet(-1)} className="w-8 h-8 rounded-full bg-red-900 hover:bg-red-800 text-white flex items-center justify-center font-bold shadow-lg active:scale-95 transition">-</button>
                        <span className="w-14 text-center text-white font-bold text-sm">R$ {betAmount}</span>
                        <button onClick={() => changeBet(1)} className="w-8 h-8 rounded-full bg-red-900 hover:bg-red-800 text-white flex items-center justify-center font-bold shadow-lg active:scale-95 transition">+</button>
                    </div>
                </div>

                {/* BOTÃO GIRAR REDONDO E MODERNO */}
                <div className="relative -mt-6">
                    <button 
                        onClick={handleSpin}
                        disabled={isSpinning || bonusActive}
                        className={`
                            w-24 h-24 rounded-full bg-gradient-to-b from-[#4ade80] to-[#15803d] border-[6px] border-[#14532d]
                            shadow-[0_10px_0_#14532d,0_20px_20px_rgba(0,0,0,0.5)] 
                            flex items-center justify-center relative overflow-hidden group transition-all duration-100
                            active:translate-y-[6px] active:shadow-[0_4px_0_#14532d,0_10px_10px_rgba(0,0,0,0.5)]
                            ${isSpinning ? 'brightness-75 cursor-not-allowed' : 'hover:brightness-110'}
                        `}
                    >
                        {/* Brilho interno */}
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full pointer-events-none"></div>
                        
                        {/* Ícone de Setas Girando */}
                        <div className={`text-yellow-300 drop-shadow-md ${isSpinning ? 'animate-spin' : ''}`}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4V1L8 5L12 9V6C15.3137 6 18 8.68629 18 12C18 13.6569 17.3284 15.1569 16.2426 16.2426L17.6569 17.6569C19.1178 16.196 20 14.1989 20 12C20 7.58172 16.4183 4 12 4Z" />
                                <path d="M12 20V23L16 19L12 15V18C8.68629 18 6 15.3137 6 12C6 10.3431 6.67157 8.84315 7.75736 7.75736L6.34315 6.34315C4.88223 7.80402 4 9.80112 4 12C4 16.4183 7.58172 20 12 20Z" />
                            </svg>
                        </div>
                    </button>
                </div>

                {/* Turbo */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Turbo</span>
                    <button 
                        onClick={() => setTurboMode(!turboMode)}
                        className={`
                            w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all
                            ${turboMode 
                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse' 
                                : 'bg-[#2a0e0e] border-gray-700 text-gray-600'}
                        `}
                    >
                        <Zap size={20} fill={turboMode ? "currentColor" : "none"} />
                    </button>
                </div>

            </div>
        </div>

        {/* Modal de Bônus (Cartas) */}
        {bonusActive && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
              <h2 className="text-3xl font-black text-yellow-400 mb-2 text-center animate-bounce">TIGRE DA SORTE!</h2>
              <p className="text-white mb-8 text-center">Escolha uma carta para multiplicar seu prêmio</p>
              
              <div className="flex justify-center gap-4">
                  {[1, 2, 3].map(i => (
                      <div 
                        key={i}
                        onClick={handleCardClick}
                        className="w-24 h-36 bg-gradient-to-br from-red-600 to-red-900 rounded-xl border-2 border-yellow-400 flex items-center justify-center cursor-pointer hover:-translate-y-4 transition-transform shadow-[0_0_30px_rgba(255,200,0,0.3)] group"
                      >
                          <span className="text-5xl group-hover:scale-125 transition-transform">🧧</span>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* Big Win Overlay */}
        {lastWin && winAmount > betAmount * 5 && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 pointer-events-none">
                <div className="text-center animate-zoomIn">
                    <h2 className="text-6xl font-black text-yellow-500 italic drop-shadow-[0_5px_0_#7f1d1d] stroke-red-900 tracking-tighter">BIG WIN</h2>
                    <p className="text-3xl text-white font-bold drop-shadow-md mt-2">R$ {winAmount.toFixed(2)}</p>
                </div>
            </div>
        )}

        {/* Error Notification */}
        {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full shadow-xl text-sm font-bold z-50 animate-bounce whitespace-nowrap border border-white/20">
                {error}
            </div>
        )}
      </div>
    </div>
  );
};
