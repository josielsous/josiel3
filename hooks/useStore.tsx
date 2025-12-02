import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Transaction, GameSettings, View, PasswordResetRequest, SpinResult } from '../types';

// Configuração do Admin solicitado
const INITIAL_ADMIN: User = {
  id: 'admin-josiel',
  username: 'josieljcel',
  name: 'Josiel Admin',
  email: 'admin@rachapix.com',
  password: '816708',
  role: 'ADMIN',
  balance: 1000000,
  affiliateCode: 'ADMIN01',
  referralCount: 0,
  dailyWithdrawTotal: 0,
  lastWithdrawDate: new Date().toISOString().split('T')[0],
  isBlocked: false,
  spinCycleIndex: 0
};

// Símbolos e Multiplicadores
const SYMBOLS = ['🍊', '🔔', '🧧', '💰', '💎', '🐯'];
const PAYOUTS:Record<string, number> = {
    '🍊': 0.5, // Laranja (Baixo)
    '🔔': 1,   // Sino
    '🧧': 2,   // Envelope
    '💰': 3,   // Saco
    '💎': 5,   // Diamante
    '🐯': 10   // Tigre (Wild)
};

// PADRÃO DE CICLO MANIPULADO (SOLICITADO)
const WIN_CYCLE = [
    // FASE 1: A ISCA (10 Rodadas - Misto de vitórias para animar)
    true, false, true, true, false, true, true, false, true, false,
    
    // FASE 2: A QUEDA (Derruba o saldo para perto de 5 reais)
    false, false, false, true, false, false, false, false, false, false,
    
    // FASE 3: A RECUPERAÇÃO (Sobe para 15 -> 30 -> 40)
    true, true, false, true, true, true, false, true, false, true,
    
    // FASE 4: O LUCRO DA CASA (Sequência longa de derrotas)
    false, false, false, false, false, true, false, false, false, false,
    false, false, false, false, true, false, false, false, false, false
];

interface StoreContextType {
  user: User | null;
  users: User[];
  transactions: Transaction[];
  pwdRequests: PasswordResetRequest[];
  gameSettings: GameSettings;
  currentView: View;
  
  // Actions
  setView: (view: View) => void;
  register: (username: string, email: string, name: string, pass: string, referralCode?: string) => Promise<boolean>;
  login: (identifier: string, pass: string, remember?: boolean, isAdminAttempt?: boolean) => Promise<{ success: boolean; msg?: string }>;
  logout: () => void;
  requestDeposit: (amount: number, txDetails: string) => void; 
  approveDeposit: (txId: string) => void; 
  rejectDeposit: (txId: string) => void;
  requestWithdraw: (amount: number, pixKey: string) => boolean;
  
  // New Game Action
  spinSlot: (amount: number) => Promise<SpinResult>;
  claimBonus: (amount: number) => void;
  
  // Admin Actions
  updateSettings: (settings: GameSettings) => void;
  toggleMaintenance: () => void; // NOVO
  approveWithdraw: (txId: string) => void;
  rejectWithdraw: (txId: string) => void;
  addBalanceManual: (userId: string, amount: number) => void;
  adminClearTransactions: () => void; // Limpar histórico
  
  // User Management Actions
  adminBlockUser: (userId: string) => void;
  adminUnblockUser: (userId: string) => void;
  adminDeleteUser: (userId: string) => void;
  adminResetPassword: (userId: string, newPass: string) => void;
  refreshUserList: () => void; // NOVO: Forçar atualização
  restoreFromAutoBackup: () => void; // NOVO: Restaurar do Backup
  
  // Password Reset System
  requestPasswordReset: (email: string) => boolean;
  resolvePasswordRequest: (requestId: string) => void;
  
  // Data Management
  exportDatabase: () => void;
  importDatabase: (jsonData: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  
  // --- CARREGAMENTO INICIAL BLINDADO ---
  const [users, setUsers] = useState<User[]>(() => {
    try {
        let local = localStorage.getItem('rp_users');
        
        // TENTATIVA DE AUTO-RECUPERAÇÃO:
        // Se a lista principal estiver vazia ou quebrada, tenta o BACKUP AUTOMÁTICO
        if (!local || local === '[]' || local.length < 50) {
            const backup = localStorage.getItem('rp_users_safe_backup');
            if (backup && backup.length > 50) {
                console.log("♻️ RECUPERAÇÃO AUTOMÁTICA: Usando backup seguro.");
                local = backup;
            }
        }

        let parsedUsers: User[] = local ? JSON.parse(local) : [];
        
        // Se ainda estiver vazia ou inválida, inicia com Admin
        if (!Array.isArray(parsedUsers) || parsedUsers.length === 0) {
            return [INITIAL_ADMIN];
        }

        // Garante que o Admin sempre exista e esteja correto (merge seguro)
        const adminIndex = parsedUsers.findIndex(u => u.username === INITIAL_ADMIN.username);
        if (adminIndex >= 0) {
            // Atualiza senha e role do admin, preservando outros dados se existirem
            parsedUsers[adminIndex] = { 
                ...parsedUsers[adminIndex], 
                role: 'ADMIN', 
                password: INITIAL_ADMIN.password, 
                isBlocked: false 
            };
        } else {
            parsedUsers.push(INITIAL_ADMIN);
        }
        return parsedUsers;
    } catch (e) {
        console.error("Erro ao carregar usuários:", e);
        return [INITIAL_ADMIN];
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
      try {
          const local = localStorage.getItem('rp_tx');
          return local ? JSON.parse(local) : [];
      } catch (e) { return []; }
  });

  const [pwdRequests, setPwdRequests] = useState<PasswordResetRequest[]>(() => {
      try {
          const local = localStorage.getItem('rp_reqs');
          return local ? JSON.parse(local) : [];
      } catch (e) { return []; }
  });

  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
      try {
          const local = localStorage.getItem('rp_settings');
          // Default maintenanceMode to false
          const defaults = { winRate: 10, winMultiplier: 3, maintenanceMode: false };
          return local ? { ...defaults, ...JSON.parse(local) } : defaults;
      } catch (e) { return { winRate: 10, winMultiplier: 3, maintenanceMode: false }; }
  });

  const [currentView, setCurrentView] = useState<View>('HOME');
  const [user, setUser] = useState<User | null>(null);

  // MIGRATION SYSTEM: Auto-Repair users if code structure changes
  useEffect(() => {
      if (users.length > 0) {
          let hasChanges = false;
          const updatedUsers = users.map(u => {
              // Ensure spinCycleIndex exists
              if (u.spinCycleIndex === undefined) {
                  hasChanges = true;
                  return { ...u, spinCycleIndex: 0 };
              }
              return u;
          });
          
          if (hasChanges) {
              setUsers(updatedUsers);
              console.log("Database Auto-Repaired (Migration applied).");
          }
      }
  }, []);

  // Recuperar Sessão Ativa
  useEffect(() => {
    const savedSessionId = localStorage.getItem('rp_current_user_id') || sessionStorage.getItem('rp_current_user_id');
    if (savedSessionId) {
      const returningUser = users.find((u: User) => u.id === savedSessionId);
      if (returningUser && !returningUser.isBlocked) {
        setUser(returningUser);
        if (returningUser.role === 'ADMIN') setCurrentView('ADMIN');
        else if (currentView === 'HOME' || currentView === 'LOGIN') setCurrentView('DASHBOARD');
      }
    }
  }, []); 

  // --- PERSISTÊNCIA BLINDADA COM TRAVA RIGOROSA (DATA SAFETY GUARD) ---
  useEffect(() => { 
      const storedData = localStorage.getItem('rp_users');
      if (storedData) {
          try {
              const storedUsers = JSON.parse(storedData);
              // CRÍTICO: Se o localStorage tem MAIS DE 1 usuário (Admin + Alguém), 
              // mas o estado atual só tem 1 (Admin), BLOQUEIA O SALVAMENTO.
              // Isso impede que um carregamento falho apague o banco.
              if (Array.isArray(storedUsers) && storedUsers.length > 1 && users.length <= 1) {
                  console.warn("⚠️ BLOQUEIO DE SEGURANÇA ATIVADO: Tentativa de sobrescrever usuários reais por lista vazia.");
                  return; // CANCELA O SALVAMENTO
              }
          } catch(e) {}
      }
      
      // Salva o estado atual
      localStorage.setItem('rp_users', JSON.stringify(users)); 
      
      // --- CRIA BACKUP DE SEGURANÇA ---
      // Se tiver usuários reais (mais que só o admin), atualiza o backup seguro
      if (users.length > 1) {
          localStorage.setItem('rp_users_safe_backup', JSON.stringify(users));
      }

  }, [users]);

  useEffect(() => { localStorage.setItem('rp_tx', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('rp_reqs', JSON.stringify(pwdRequests)); }, [pwdRequests]);
  useEffect(() => { localStorage.setItem('rp_settings', JSON.stringify(gameSettings)); }, [gameSettings]);

  // --- Helpers ---
  const generateAffiliateCode = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
  };

  const register = async (username: string, email: string, name: string, pass: string, referralCode?: string): Promise<boolean> => {
    if (gameSettings.maintenanceMode) { alert("Manutenção em andamento. Tente novamente em breve."); return false; }
    
    await new Promise(r => setTimeout(r, 800));
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase())) return false;

    let referrerId = undefined;
    if (referralCode) {
        const referrer = users.find(u => u.affiliateCode === referralCode);
        if (referrer) {
            referrerId = referrer.id;
            // Atualiza contador do indicador (Cria nova array de users para disparar o save)
            setUsers(prev => prev.map(u => u.id === referrer.id ? { ...u, referralCount: (u.referralCount || 0) + 1 } : u));
        }
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username, name, email, password: pass, role: 'USER', balance: 0,
      affiliateCode: generateAffiliateCode(name), referralCount: 0, referredBy: referrerId,
      dailyWithdrawTotal: 0, lastWithdrawDate: new Date().toISOString().split('T')[0], isBlocked: false,
      spinCycleIndex: 0
    };

    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    localStorage.setItem('rp_current_user_id', newUser.id);
    setCurrentView('DASHBOARD');
    return true;
  };

  const login = async (identifier: string, pass: string, remember: boolean = true, isAdminAttempt: boolean = false): Promise<{ success: boolean; msg?: string }> => {
    await new Promise(r => setTimeout(r, 800));
    const foundUser = users.find(u => u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase());
    
    if (!foundUser) return { success: false, msg: 'Usuário não encontrado.' };
    if (foundUser.isBlocked) return { success: false, msg: 'Conta bloqueada.' };
    
    // Admin Override
    if (foundUser.role === 'ADMIN') {
        if(foundUser.password !== pass) return { success: false, msg: 'Senha administrativa incorreta.' };
        setUser(foundUser);
        setCurrentView('ADMIN');
        return { success: true };
    }

    if (gameSettings.maintenanceMode) return { success: false, msg: '⚠️ SISTEMA EM MANUTENÇÃO ⚠️' };

    if (isAdminAttempt && foundUser.role !== 'ADMIN') return { success: false, msg: 'Acesso negado.' };

    if (foundUser.password === pass) {
      setUser(foundUser);
      if (remember) { localStorage.setItem('rp_current_user_id', foundUser.id); sessionStorage.removeItem('rp_current_user_id'); }
      else { sessionStorage.setItem('rp_current_user_id', foundUser.id); localStorage.removeItem('rp_current_user_id'); }
      
      setCurrentView('DASHBOARD');
      return { success: true };
    }
    return { success: false, msg: 'Senha incorreta.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rp_current_user_id');
    sessionStorage.removeItem('rp_current_user_id');
    setCurrentView('LOGIN'); 
  };

  const requestPasswordReset = (email: string) => {
      const u = users.find(user => user.email.toLowerCase() === email.toLowerCase());
      if (!u) return false;
      setPwdRequests(prev => [{ id: crypto.randomUUID(), userId: u.id, username: u.username, email: u.email, date: new Date().toISOString(), status: 'PENDING' }, ...prev]);
      return true;
  };

  const resolvePasswordRequest = (requestId: string) => {
      setPwdRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'RESOLVED' } : r));
  };

  const exportDatabase = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ users, transactions, pwdRequests, gameSettings, timestamp: new Date().toISOString() }));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "rachapix_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const importDatabase = (jsonData: string) => {
      try {
          const db = JSON.parse(jsonData);
          if (db.users) setUsers(db.users);
          if (db.transactions) setTransactions(db.transactions);
          if (db.pwdRequests) setPwdRequests(db.pwdRequests);
          if (db.gameSettings) setGameSettings(db.gameSettings);
          alert("Backup restaurado!");
          return true;
      } catch (e) { return false; }
  };

  const updateUserBalance = (userId: string, amount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newBalance = u.balance + amount;
        const updatedUser = { ...u, balance: newBalance };
        if (user && user.id === userId) setUser(updatedUser);
        return updatedUser;
      }
      return u;
    }));
  };

  const requestDeposit = (amount: number, txDetails: string) => {
    if (!user) return;
    if (gameSettings.maintenanceMode) { alert("Sistema em manutenção."); return; }
    setTransactions(prev => [{ id: crypto.randomUUID(), userId: user.id, type: 'DEPOSIT', amount, date: new Date().toISOString(), status: 'PENDING', details: txDetails }, ...prev]);
  };

  const approveDeposit = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (tx && tx.status === 'PENDING') {
        updateUserBalance(tx.userId, tx.amount);
        
        if (tx.amount >= 10) {
            const bonusAmount = 5.00;
            setTimeout(() => {
                updateUserBalance(tx.userId, bonusAmount);
                setTransactions(prev => [{ 
                    id: crypto.randomUUID(), 
                    userId: tx.userId, 
                    type: 'BONUS_GAME', 
                    amount: bonusAmount, 
                    date: new Date().toISOString(), 
                    status: 'COMPLETED', 
                    details: '🎁 BÔNUS DE DEPÓSITO' 
                }, ...prev]);
            }, 1000);
        }

        const depositor = users.find(u => u.id === tx.userId);
        if (depositor && depositor.referredBy && tx.amount >= 10) {
            updateUserBalance(depositor.referredBy, 3.00);
            setTransactions(prev => [{ id: crypto.randomUUID(), userId: depositor.referredBy!, type: 'BONUS_AFFILIATE', amount: 3.00, date: new Date().toISOString(), status: 'COMPLETED', details: `Ref: ${depositor.username}` }, ...prev]);
        }
        
        setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'COMPLETED' } : t));
    }
  };

  const rejectDeposit = (txId: string) => setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'REJECTED' } : t));

  const requestWithdraw = (amount: number, pixKey: string): boolean => {
    if (!user || user.balance < amount || amount < 10) return false;
    if (gameSettings.maintenanceMode) return false;
    
    const today = new Date().toISOString().split('T')[0];
    const currentDailyTotal = user.lastWithdrawDate === today ? (user.dailyWithdrawTotal || 0) : 0;
    
    if (currentDailyTotal + amount > 2000) return false;

    setTransactions(prev => [{ id: crypto.randomUUID(), userId: user.id, type: 'WITHDRAW', amount, date: new Date().toISOString(), status: 'PENDING', details: pixKey }, ...prev]);
    
    setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
            const updatedUser = { ...u, balance: u.balance - amount, dailyWithdrawTotal: currentDailyTotal + amount, lastWithdrawDate: today };
            setUser(updatedUser);
            return updatedUser;
        }
        return u;
    }));
    return true;
  };

  const approveWithdraw = (txId: string) => setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'COMPLETED' } : t));
  const rejectWithdraw = (txId: string) => {
      const tx = transactions.find(t => t.id === txId);
      if(tx) {
          updateUserBalance(tx.userId, tx.amount);
          setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'REJECTED' } : t));
      }
  };

  const addBalanceManual = (userId: string, amount: number) => updateUserBalance(userId, amount);
  const adminClearTransactions = () => setTransactions([]);

  // --- LÓGICA DE SLOT MACHINE ---
  const spinSlot = async (betAmount: number): Promise<SpinResult> => {
    if (gameSettings.maintenanceMode) throw new Error("MANUTENÇÃO: Jogo pausado.");
    if (!user || user.balance < betAmount) throw new Error("Saldo insuficiente");

    // 1. Debitar a aposta
    setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
            const updated = { ...u, balance: u.balance - betAmount };
            setUser(updated); 
            return updated;
        }
        return u;
    }));
    
    // 2. Trava de Segurança Financeira
    const allDeposits = transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);
    const allWithdraws = transactions.filter(t => t.type === 'WITHDRAW' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);
    const houseVault = allDeposits - allWithdraws; 
    
    const houseHasMoney = houseVault > (betAmount * 5); 

    // 3. Resultado pelo Ciclo
    const currentIndex = user.spinCycleIndex || 0;
    let shouldWin = WIN_CYCLE[currentIndex % WIN_CYCLE.length];
    
    const nextIndex = (currentIndex + 1) % WIN_CYCLE.length;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, spinCycleIndex: nextIndex } : u));
    
    if (!houseHasMoney) shouldWin = false;

    const canHaveBonus = shouldWin && houseVault > (betAmount * 20);
    const isBonus = canHaveBonus && Math.random() < 0.02;

    let grid: string[] = [];
    let winAmount = 0;
    let winningLines: number[] = [];

    if (isBonus) {
        const bonusSymbol = '🐯'; 
        grid = Array(9).fill(bonusSymbol);
        winAmount = betAmount * PAYOUTS[bonusSymbol] * 5; 
        winningLines = [0, 1, 2, 3, 4, 5, 6, 7, 8]; 
    } else if (shouldWin) {
        grid = Array(9).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 1))]); 
        const symbol = SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 1))];
        const row = Math.floor(Math.random() * 3);
        grid[row * 3] = symbol;
        grid[row * 3 + 1] = symbol;
        grid[row * 3 + 2] = symbol;
        winningLines = [row * 3, row * 3 + 1, row * 3 + 2];
        winAmount = betAmount * PAYOUTS[symbol];
    } else {
        let safeGrid = false;
        while(!safeGrid) {
            grid = Array(9).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
            const hasH1 = grid[0]===grid[1] && grid[1]===grid[2];
            const hasH2 = grid[3]===grid[4] && grid[4]===grid[5];
            const hasH3 = grid[6]===grid[7] && grid[7]===grid[8];
            if(!hasH1 && !hasH2 && !hasH3) safeGrid = true;
        }
        winAmount = 0;
    }

    if (winAmount > 0) {
        updateUserBalance(user.id, winAmount);
        setTransactions(prev => [{ id: crypto.randomUUID(), userId: user.id, type: 'BET_WIN', amount: winAmount, date: new Date().toISOString(), status: 'COMPLETED' }, ...prev]);
    } else {
        setTransactions(prev => [{ id: crypto.randomUUID(), userId: user.id, type: 'BET_LOSS', amount: betAmount, date: new Date().toISOString(), status: 'COMPLETED' }, ...prev]);
    }

    return { grid, win: shouldWin || isBonus, amountWon: winAmount, isBonus, winningLines };
  };

  const claimBonus = (amount: number) => {
      if(user) {
          updateUserBalance(user.id, amount);
          setTransactions(prev => [{ id: crypto.randomUUID(), userId: user.id, type: 'BONUS_GAME', amount: amount, date: new Date().toISOString(), status: 'COMPLETED', details: 'Carta do Tigre 10x' }, ...prev]);
      }
  }

  // Admin Controls
  const adminBlockUser = (userId: string) => setUsers(prev => prev.map(u => u.id === userId && u.role !== 'ADMIN' ? { ...u, isBlocked: true } : u));
  const adminUnblockUser = (userId: string) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: false } : u));
  const adminDeleteUser = (userId: string) => setUsers(prev => prev.filter(u => u.id !== userId));
  const adminResetPassword = (userId: string, newPass: string) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPass } : u));
  const updateSettings = (settings: GameSettings) => setGameSettings(settings);
  const toggleMaintenance = () => setGameSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
  const refreshUserList = () => {
      // Forçar leitura do localstorage
      const local = localStorage.getItem('rp_users');
      if (local) setUsers(JSON.parse(local));
  };
  const restoreFromAutoBackup = () => {
      const backup = localStorage.getItem('rp_users_safe_backup');
      if (backup) {
          if (confirm("Deseja restaurar o backup de segurança automático? Isso trará de volta os usuários salvos anteriormente.")) {
              setUsers(JSON.parse(backup));
              alert("Backup restaurado com sucesso!");
          }
      } else {
          alert("Nenhum backup automático encontrado.");
      }
  };

  return (
    <StoreContext.Provider value={{
      user, users, transactions, gameSettings, currentView, pwdRequests,
      setView: setCurrentView, register, login, logout,
      requestDeposit, approveDeposit, rejectDeposit, requestWithdraw, 
      spinSlot, claimBonus, 
      updateSettings, toggleMaintenance, approveWithdraw, rejectWithdraw, addBalanceManual, adminClearTransactions,
      adminBlockUser, adminUnblockUser, adminDeleteUser, adminResetPassword, refreshUserList, restoreFromAutoBackup,
      requestPasswordReset, resolvePasswordRequest, exportDatabase, importDatabase
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};