
import React from 'react';
import { useStore } from '../hooks/useStore';
import { Button } from '../components/ui/Components';
import { Zap, ShieldCheck, Banknote } from 'lucide-react';

export const Home = () => {
  const { setView } = useStore();

  return (
    <div className="space-y-10 py-4 overflow-hidden">
      
      {/* TIGER MARQUEE BANNER */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-yellow-600/20 to-orange-600/20 py-4 border-y border-yellow-500/30">
        <div className="absolute inset-0 bg-dark-950/50 z-10"></div>
        <div className="flex whitespace-nowrap animate-marquee relative z-20">
          {[...Array(20)].map((_, i) => (
             <span key={i} className="mx-8 text-4xl flex items-center gap-4">
                🐯 💰 💎 <span className="text-yellow-400 font-bold italic brand-font">RACHAPIX</span> 💸 🍊 🐯
             </span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-6 animate-fadeIn px-4">
        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
          RACHA<span className="text-neon-green">PIX</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
          O Jogo Mais Veloz do Pix. <br />
          Deposite, aposte e tente <span className="text-neon-blue font-bold">RACHAR</span> o prêmio agora mesmo!
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button variant="neon" className="text-lg px-10 py-4 animate-bounce" onClick={() => setView('REGISTER')}>
            CRIAR CONTA AGORA
          </Button>
          <Button variant="secondary" className="text-lg px-10 py-4" onClick={() => setView('LOGIN')}>
            JÁ TENHO CONTA
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mt-12 px-4">
        <div className="bg-dark-900 p-8 rounded-2xl border border-gray-800 hover:border-neon-green transition-colors group">
          <div className="bg-dark-800 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Zap className="text-neon-green w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Depósito Instantâneo</h3>
          <p className="text-gray-400">Seu Pix cai na hora. Sem espera, sem burocracia. Copiou, pagou, jogou.</p>
        </div>

        <div className="bg-dark-900 p-8 rounded-2xl border border-gray-800 hover:border-neon-blue transition-colors group">
          <div className="bg-dark-800 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Banknote className="text-neon-blue w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Saque Rápido</h3>
          <p className="text-gray-400">Ganhou? O dinheiro é seu. Solicite o saque e receba direto na sua conta.</p>
        </div>

        <div className="bg-dark-900 p-8 rounded-2xl border border-gray-800 hover:border-purple-500 transition-colors group">
          <div className="bg-dark-800 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShieldCheck className="text-purple-500 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Segurança Total</h3>
          <p className="text-gray-400">Sistema transparente. Suas informações e seu saldo estão protegidos.</p>
        </div>
      </div>
      
      {/* CTA Footer */}
      <div className="px-4">
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 border border-gray-800 rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-neon-blue to-purple-500"></div>
            <h2 className="text-3xl font-bold mb-4">Pronto para Rachar?</h2>
            <p className="text-gray-400 mb-8">Junte-se a milhares de jogadores e teste sua sorte hoje.</p>
            <Button variant="neon" className="px-12" onClick={() => setView('REGISTER')}>COMEÇAR AGORA</Button>
        </div>
      </div>

    </div>
  );
};
