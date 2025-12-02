
import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Button } from './ui/Components';
import { Menu, X, DollarSign, User as UserIcon, LogOut, Home, Gamepad2, Settings, Trophy, Wallet } from 'lucide-react';

// Novo componente de Faixa Promocional
const PromoMarquee = () => {
  return (
    <div className="relative w-full bg-gradient-to-r from-red-600 via-yellow-600 to-red-600 overflow-hidden h-8 flex items-center border-b border-yellow-400">
        <div className="absolute inset-0 bg-black/10 z-10"></div>
        <div className="flex whitespace-nowrap animate-marquee relative z-20 text-white font-bold text-xs md:text-sm">
             <span className="mx-8">🔥 PROMOÇÃO: DEPOSITE R$ 10 E GANHE R$ 5 DE BÔNUS! 🔥</span>
             <span className="mx-8">💰 CONVIDE AMIGOS E GANHE R$ 3,00 POR CADASTRO! 💰</span>
             <span className="mx-8">🐯 O TIGRE TÁ PAGANDO! UM JOGADOR ACABOU DE SAIR COM R$ 500! 🐯</span>
             <span className="mx-8">💎 SAQUE PIX EM ATÉ 2 HORAS! 💎</span>
             <span className="mx-8">🎁 BÔNUS DE BOAS-VINDAS ATIVO! 🎁</span>
             <span className="mx-8">🔥 PROMOÇÃO: DEPOSITE R$ 10 E GANHE R$ 5 DE BÔNUS! 🔥</span>
             <span className="mx-8">💰 CONVIDE AMIGOS E GANHE R$ 3,00 POR CADASTRO! 💰</span>
        </div>
    </div>
  );
};

// --- COMPONENTE DE NOTIFICAÇÃO DE GANHADORES (RODAPÉ) ---
const LiveWinnersNotification = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({ name: '', action: '', amount: '', type: 'win' });

  const names = [
    "João S.", "Maria O.", "Pedro K.", "Ana L.", "Carlos D.", "Lucas M.", "Fernanda P.", 
    "Rafael B.", "Juliana T.", "Marcos A.", "Bruna C.", "Gabriel R.", "Larissa F.", 
    "Thiago S.", "Camila M.", "Rodrigo L.", "Beatriz G.", "Felipe N.", "Mariana J."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Oculta para trocar
      setVisible(false);

      // 2. Gera novos dados após breve delay
      setTimeout(() => {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const isWin = Math.random() > 0.4; // 60% chance de ser Vitória, 40% Saque
        
        let randomAmount;
        if (isWin) {
           // Ganhos variam de 10 a 300
           randomAmount = (Math.random() * 290 + 10).toFixed(2);
        } else {
           // Saques variam de 50 a 1000
           randomAmount = (Math.random() * 950 + 50).toFixed(2);
        }

        setData({
          name: randomName,
          action: isWin ? "ganhou no Tigre" : "recebeu saque Pix",
          amount: randomAmount,
          type: isWin ? 'win' : 'withdraw'
        });

        setVisible(true);
      }, 500); // Tempo para desaparecer e reaparecer

    }, 3500); // Ciclo de 3.5 segundos

    return () => clearInterval(interval);
  }, []);

  if (!data.name) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-40 transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
    >
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-full shadow-2xl border backdrop-blur-md
        ${data.type === 'win' 
          ? 'bg-green-900/80 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
          : 'bg-blue-900/80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}
      `}>
        <div className={`
          p-2 rounded-full 
          ${data.type === 'win' ? 'bg-green-500 text-black' : 'bg-blue-500 text-white'}
        `}>
          {data.type === 'win' ? <Trophy size={16} /> : <Wallet size={16} />}
        </div>
        
        <div className="flex flex-col pr-2">
          <span className="text-xs text-gray-300 font-bold leading-tight">{data.name}</span>
          <span className="text-[10px] text-gray-400 uppercase leading-tight">{data.action}</span>
          <span className={`text-sm font-black leading-tight ${data.type === 'win' ? 'text-green-400' : 'text-blue-300'}`}>
            R$ {data.amount}
          </span>
        </div>
      </div>
    </div>
  );
};

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout, setView, currentView } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItemClass = (viewName: string) => 
    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${currentView === viewName ? 'text-neon-green bg-dark-800' : 'text-gray-400 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      {/* Promo Bar (Não mostra no Admin para não poluir) */}
      {currentView !== 'ADMIN' && <PromoMarquee />}

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div 
              className="flex-shrink-0 cursor-pointer flex items-center" 
              onClick={() => setView(user ? 'DASHBOARD' : 'HOME')}
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-neon-green to-neon-blue rounded-full mr-2 animate-pulse-fast"></div>
              <span className="text-2xl font-bold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue brand-font">
                RACHAPIX
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-4">
                {user ? (
                  <>
                     <button onClick={() => setView('DASHBOARD')} className={navItemClass('DASHBOARD')}>
                      <Home size={18} /> <span>Dashboard</span>
                    </button>
                    <button onClick={() => setView('GAME')} className={navItemClass('GAME')}>
                      <Gamepad2 size={18} /> <span>Jogar</span>
                    </button>
                    <button onClick={() => setView('DEPOSIT')} className={navItemClass('DEPOSIT')}>
                      <DollarSign size={18} /> <span>Depósito</span>
                    </button>
                    <button onClick={() => setView('WITHDRAW')} className={navItemClass('WITHDRAW')}>
                      <DollarSign size={18} /> <span>Saque</span>
                    </button>
                    {user.role === 'ADMIN' && (
                      <button onClick={() => setView('ADMIN')} className={navItemClass('ADMIN')}>
                        <Settings size={18} /> <span>Admin</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button onClick={() => setView('HOME')} className={navItemClass('HOME')}>Início</button>
                    <button onClick={() => setView('LOGIN')} className={navItemClass('LOGIN')}>Login</button>
                  </>
                )}
              </div>
            </div>

            {/* User Profile / Mobile Toggle */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-neon-green">R$ {user.balance.toFixed(2)}</p>
                  </div>
                  <Button variant="secondary" onClick={logout} className="!px-3 !py-2">
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <div className="hidden md:block">
                   <Button variant="neon" onClick={() => setView('REGISTER')}>Criar Conta</Button>
                </div>
              )}
              
              <div className="-mr-2 flex md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="bg-dark-800 p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
                >
                  {mobileMenuOpen ? <X /> : <Menu />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark-900 border-b border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user ? (
                <>
                  <div className="px-4 py-2 border-b border-gray-800 mb-2">
                    <p className="text-white font-bold">{user.name}</p>
                    <p className="text-neon-green">Saldo: R$ {user.balance.toFixed(2)}</p>
                  </div>
                  <button onClick={() => { setView('DASHBOARD'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-dark-800">Dashboard</button>
                  <button onClick={() => { setView('GAME'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neon-green hover:bg-dark-800">JOGAR AGORA</button>
                  <button onClick={() => { setView('DEPOSIT'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-dark-800">Depósito</button>
                  <button onClick={() => { setView('WITHDRAW'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-dark-800">Saque</button>
                  {user.role === 'ADMIN' && (
                     <button onClick={() => { setView('ADMIN'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-purple-400 hover:bg-dark-800">Painel ADM</button>
                  )}
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-dark-800">Sair</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setView('HOME'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-dark-800">Início</button>
                  <button onClick={() => { setView('LOGIN'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-dark-800">Entrar</button>
                  <button onClick={() => { setView('REGISTER'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neon-green hover:bg-dark-800">Cadastrar</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      {/* COMPONENTE DE NOTIFICAÇÃO DE GANHADORES FLUTUANTE */}
      {currentView !== 'ADMIN' && <LiveWinnersNotification />}

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 RachaPix. Jogue com responsabilidade. +18.</p>
        </div>
      </footer>
    </div>
  );
};
