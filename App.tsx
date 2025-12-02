
import React from 'react';
import { StoreProvider, useStore } from './hooks/useStore';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login, Register } from './pages/Auth';
import { Dashboard, Deposit, Withdraw } from './pages/Dashboard';
import { Game } from './pages/Game';
import { Admin } from './pages/Admin';
import { AlertTriangle, LockKeyhole } from 'lucide-react';

const MaintenanceScreen = ({ onAdminLogin }: { onAdminLogin: () => void }) => (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-bounce mb-6">
            <AlertTriangle className="text-yellow-500 w-24 h-24" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 brand-font uppercase">Sistema em Manutenção</h1>
        <p className="text-xl text-gray-400 max-w-lg mb-8">
            Estamos fazendo melhorias rápidas no servidor para garantir mais segurança e velocidade. 
            <br/><br/>
            <span className="text-neon-green font-bold">Voltaremos em alguns instantes!</span>
        </p>
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-12">
            <div className="h-full bg-yellow-500 animate-[marquee_2s_linear_infinite]"></div>
        </div>

        {/* Botão de Resgate para o Admin */}
        <button 
            onClick={onAdminLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-sm border border-gray-800 hover:border-white px-4 py-2 rounded-full"
        >
            <LockKeyhole size={14} />
            Acesso Administrativo
        </button>
    </div>
);

const AppContent = () => {
  const { currentView, user, gameSettings, setView } = useStore();

  // A manutenção bloqueia se:
  // 1. O modo está ativo
  // 2. O usuário NÃO é admin
  // 3. A tela NÃO é a de Login (para permitir que o admin entre)
  const isMaintenance = gameSettings?.maintenanceMode && user?.role !== 'ADMIN' && currentView !== 'LOGIN';

  const renderView = () => {
    switch (currentView) {
      case 'HOME': return <Home />;
      case 'LOGIN': return <Login />;
      case 'REGISTER': return <Register />;
      case 'DASHBOARD': return user ? <Dashboard /> : <Login />;
      case 'DEPOSIT': return user ? <Deposit /> : <Login />;
      case 'GAME': return user ? <Game /> : <Login />;
      case 'WITHDRAW': return user ? <Withdraw /> : <Login />;
      case 'ADMIN': return user && user.role === 'ADMIN' ? <Admin /> : <Dashboard />;
      default: return <Home />;
    }
  };

  return (
    <>
        {isMaintenance && <MaintenanceScreen onAdminLogin={() => setView('LOGIN')} />}
        <Layout>
          {renderView()}
        </Layout>
    </>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
