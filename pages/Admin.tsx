
import React, { useState, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { Card, Button, Input, Badge } from '../components/ui/Components';
import { Users, DollarSign, Settings, Check, X, Lock, Unlock, Trash2, KeyRound, FileText, ShieldAlert, Download, Upload, RefreshCw, ChevronDown, ChevronUp, Power, Database } from 'lucide-react';

export const Admin = () => {
  const { 
      users, transactions, gameSettings, pwdRequests,
      updateSettings, toggleMaintenance, approveWithdraw, rejectWithdraw, approveDeposit, rejectDeposit, 
      addBalanceManual, adminBlockUser, adminUnblockUser, adminDeleteUser, adminResetPassword, refreshUserList, restoreFromAutoBackup,
      resolvePasswordRequest, exportDatabase, importDatabase, adminClearTransactions
  } = useStore();

  const [activeTab, setActiveTab] = useState<'FINANCE' | 'USERS' | 'SETTINGS' | 'SYSTEM'>('FINANCE');
  
  // Toggle States for Tables
  const [showDeposits, setShowDeposits] = useState(true);
  const [showWithdrawals, setShowWithdrawals] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  
  // Settings State
  const [winRate, setWinRate] = useState(gameSettings.winRate.toString());
  const [multiplier, setMultiplier] = useState(gameSettings.winMultiplier.toString());
  
  // Manual Balance State
  const [manualId, setManualId] = useState('');
  const [manualAmount, setManualAmount] = useState('');

  // Estados para Modal de Mudar Senha
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingWithdrawals = transactions.filter(t => t.type === 'WITHDRAW' && t.status === 'PENDING');
  const pendingDeposits = transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'PENDING');
  const pendingPwdRequests = pwdRequests.filter(r => r.status === 'PENDING');
  
  const allDeposits = transactions
    .filter(t => t.type === 'DEPOSIT')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  const totalDepositsConfirmed = transactions
    .filter(t => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalWithdrawalsPaid = transactions
    .filter(t => t.type === 'WITHDRAW' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const houseVaultBalance = totalDepositsConfirmed - totalWithdrawalsPaid;

  const handleSaveSettings = () => {
    updateSettings({
      ...gameSettings,
      winRate: parseFloat(winRate),
      winMultiplier: parseFloat(multiplier)
    });
    alert('Configurações salvas!');
  };

  const openResetModal = (userId: string, requestId?: string) => {
      setSelectedUserId(userId);
      setNewPassword('');
      setResetModalOpen(true);
  };

  const handleConfirmPasswordReset = () => {
      if (selectedUserId && newPassword) {
          adminResetPassword(selectedUserId, newPassword);
          const pending = pwdRequests.find(r => r.userId === selectedUserId && r.status === 'PENDING');
          if (pending) resolvePasswordRequest(pending.id);

          alert('Senha alterada com sucesso! Informe ao usuário.');
          setResetModalOpen(false);
      } else {
          alert('Digite uma nova senha.');
      }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
      if(confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário ${userName}?`)) {
          adminDeleteUser(userId);
      }
  };

  const handleClearHistory = () => {
      if(confirm("ATENÇÃO: Isso vai apagar todo o histórico de transações (depósitos, saques, jogos). Os saldos dos usuários e as contas NÃO serão apagados. Deseja limpar a tabela de histórico?")) {
          adminClearTransactions();
          alert("Histórico limpo com sucesso.");
      }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) {
              importDatabase(event.target.result as string);
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="space-y-8 relative pb-20">
      
      {/* HEADER DE MANUTENÇÃO */}
      {gameSettings.maintenanceMode && (
          <div className="bg-red-600 text-white p-4 text-center font-bold animate-pulse rounded-lg border-2 border-yellow-400">
              ⚠️ MODO MANUTENÇÃO ATIVO: O SITE ESTÁ TRAVADO PARA JOGADORES ⚠️
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <h2 className="text-3xl font-bold text-purple-400 brand-font">Painel Admin</h2>
         <div className="bg-dark-800 p-1 rounded-lg flex space-x-1 flex-wrap justify-center">
            <button onClick={() => setActiveTab('FINANCE')} className={`px-4 py-2 rounded transition-all ${activeTab === 'FINANCE' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Financeiro</button>
            <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 rounded transition-all ${activeTab === 'USERS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Usuários</button>
            <button onClick={() => setActiveTab('SETTINGS')} className={`px-4 py-2 rounded transition-all ${activeTab === 'SETTINGS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Config</button>
            <button onClick={() => setActiveTab('SYSTEM')} className={`px-4 py-2 rounded transition-all ${activeTab === 'SYSTEM' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Sistema</button>
         </div>
      </div>

      {activeTab === 'SYSTEM' && (
          <div className="space-y-6">
              
              {/* BOTÃO DE PÂNICO / MANUTENÇÃO */}
              <Card className={`border-4 ${gameSettings.maintenanceMode ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10'}`}>
                   <h3 className="text-2xl font-black mb-4 flex items-center gap-2 text-white uppercase">
                       <Power size={32} /> CONTROLE DE TRAVAMENTO
                   </h3>
                   <p className="text-gray-300 mb-6">
                       Use este botão para travar o site instantaneamente. Quando ativo, ninguém consegue jogar, depositar ou sacar. Ideal para manutenções ou problemas.
                   </p>
                   <Button 
                        onClick={toggleMaintenance} 
                        fullWidth 
                        className={`py-6 text-xl font-black ${gameSettings.maintenanceMode ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_30px_#16a34a]' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_#dc2626]'}`}
                    >
                        {gameSettings.maintenanceMode ? 'DESATIVAR MANUTENÇÃO (LIBERAR SITE)' : 'ATIVAR MODO MANUTENÇÃO (TRAVAR SITE)'}
                   </Button>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-blue-500/30">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400"><Download size={20}/> Backup (Segurança)</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Baixe um arquivo de segurança com todos os dados.
                    </p>
                    <Button onClick={exportDatabase} variant="outline" className="w-full border-blue-500 text-blue-400 hover:bg-blue-900/50">
                        BAIXAR DADOS (JSON)
                    </Button>
                </Card>

                <Card className="border-red-500/30">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400"><Upload size={20}/> Restaurar Dados</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Carregue um arquivo de backup para restaurar o sistema.
                    </p>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full border-red-500 text-red-400 hover:bg-red-900/50">
                        CARREGAR ARQUIVO
                    </Button>
                </Card>

                 {/* Botão de Restauração de Emergência */}
                 <Card className="border-yellow-500/30 md:col-span-2">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400"><Database size={20}/> Restauração Automática</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Se os usuários sumiram, clique aqui. O sistema mantém uma cópia de segurança oculta no seu navegador.
                    </p>
                    <Button onClick={restoreFromAutoBackup} variant="secondary" className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-900/50">
                        RESTAURAR BACKUP AUTOMÁTICO (EMERGÊNCIA)
                    </Button>
                </Card>
              </div>
          </div>
      )}

      {activeTab === 'SETTINGS' && (
        <Card className="border-purple-900/50">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings size={20}/> Configuração do Algoritmo</h3>
            <p className="text-gray-400 text-sm mb-4">
                O sistema utiliza atualmente um <strong>Padrão Sequencial (2 Vitórias - 4 Derrotas - 3 Vitórias - 6 Derrotas)</strong>. 
                Os valores abaixo ajustam os multiplicadores, mas o ciclo de vitórias é fixo para controle de vício.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Chance Base (Ignorado pelo ciclo)" type="number" value={winRate} onChange={(e) => setWinRate(e.target.value)} />
                <Input label="Multiplicador de Prêmio (x)" type="number" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
            </div>
            <Button onClick={handleSaveSettings} variant="primary" className="mt-4 bg-purple-600 hover:bg-purple-500">Salvar Configurações</Button>
        </Card>
      )}

      {activeTab === 'FINANCE' && (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-green-900 to-green-800 p-6 rounded-2xl border border-green-600 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h3 className="text-green-300 font-bold uppercase tracking-widest text-sm mb-1">Cofre da Casa (Lucro Líquido)</h3>
                        <p className="text-4xl md:text-5xl font-black text-white">R$ {houseVaultBalance.toFixed(2)}</p>
                    </div>
                    <div className="text-right mt-4 md:mt-0">
                         <p className="text-sm text-green-200">Entradas: <span className="font-bold">+ R$ {totalDepositsConfirmed.toFixed(2)}</span></p>
                         <p className="text-sm text-red-300">Saídas: <span className="font-bold">- R$ {totalWithdrawalsPaid.toFixed(2)}</span></p>
                    </div>
                </div>
                <DollarSign className="absolute -bottom-10 -right-10 w-48 h-48 text-green-700 opacity-30" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-neon-green/30">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xl font-bold text-neon-green flex items-center gap-2"><DollarSign size={20}/> Depósitos Pendentes</h3>
                         <button onClick={() => setShowDeposits(!showDeposits)} className="text-gray-400 hover:text-white">
                             {showDeposits ? <ChevronUp /> : <ChevronDown />}
                         </button>
                    </div>
                    
                    {showDeposits && (
                        <>
                            {pendingDeposits.length === 0 ? (
                                <p className="text-gray-500 italic py-4">Nenhum depósito aguardando aprovação.</p>
                            ) : (
                                <div className="space-y-3">
                                    {pendingDeposits.map(tx => {
                                        const reqUser = users.find(u => u.id === tx.userId);
                                        return (
                                            <div key={tx.id} className="bg-dark-900 border border-gray-800 p-4 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-white text-lg">R$ {tx.amount.toFixed(2)}</p>
                                                        <p className="text-sm text-gray-400">{reqUser?.name || 'User Desconhecido'}</p>
                                                        <p className="text-xs text-gray-600 font-mono">{tx.details}</p>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleTimeString()}</div>
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => approveDeposit(tx.id)} className="flex-1 bg-green-900/50 text-green-400 hover:bg-green-800 py-2 rounded text-sm font-bold border border-green-800 flex justify-center items-center gap-1">
                                                        <Check size={16}/> Confirmar
                                                    </button>
                                                    <button onClick={() => rejectDeposit(tx.id)} className="bg-red-900/50 text-red-400 hover:bg-red-800 px-3 rounded border border-red-800">
                                                        <X size={16}/>
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </Card>

                <Card className="border-yellow-500/30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-yellow-500 flex items-center gap-2"><DollarSign size={20}/> Saques Pendentes</h3>
                        <button onClick={() => setShowWithdrawals(!showWithdrawals)} className="text-gray-400 hover:text-white">
                             {showWithdrawals ? <ChevronUp /> : <ChevronDown />}
                         </button>
                    </div>
                    
                    {showWithdrawals && (
                        <>
                            {pendingWithdrawals.length === 0 ? (
                            <p className="text-gray-500 italic py-4">Nenhum saque pendente.</p>
                            ) : (
                            <div className="space-y-3">
                                {pendingWithdrawals.map(tx => {
                                    const reqUser = users.find(u => u.id === tx.userId);
                                    return (
                                    <div key={tx.id} className="bg-dark-900 border border-gray-800 p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-white text-lg">R$ {tx.amount.toFixed(2)}</p>
                                                <p className="text-sm text-gray-400">{reqUser?.name} ({reqUser?.email})</p>
                                                <p className="text-xs text-neon-blue font-mono mt-1">Pix: {tx.details}</p>
                                            </div>
                                            <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                        <button onClick={() => approveWithdraw(tx.id)} className="flex-1 bg-green-600 hover:bg-green-500 text-black py-2 rounded text-sm font-bold flex justify-center items-center gap-1">
                                            <Check size={16}/> Pagar
                                        </button>
                                        <button onClick={() => rejectWithdraw(tx.id)} className="bg-red-600 hover:bg-red-500 text-white px-3 rounded font-bold">
                                            <X size={16}/>
                                        </button>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                            )}
                        </>
                    )}
                </Card>
            </div>

            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold flex items-center gap-2"><FileText size={20}/> Histórico Completo</h3>
                        <button onClick={() => setShowHistory(!showHistory)} className="text-gray-400 hover:text-white">
                            {showHistory ? <ChevronUp /> : <ChevronDown />}
                        </button>
                    </div>
                    {showHistory && (
                        <button 
                            onClick={handleClearHistory}
                            className="bg-red-900/50 hover:bg-red-800 text-red-400 text-xs px-3 py-2 rounded border border-red-800 flex items-center gap-2"
                        >
                            <Trash2 size={14} /> LIMPAR HISTÓRICO
                        </button>
                    )}
                </div>
                
                {showHistory && (
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-dark-800 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 text-sm text-gray-400">Data</th>
                                    <th className="p-3 text-sm text-gray-400">Usuário</th>
                                    <th className="p-3 text-sm text-gray-400">Valor</th>
                                    <th className="p-3 text-sm text-gray-400">Status</th>
                                    <th className="p-3 text-sm text-gray-400">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {allDeposits.length === 0 ? (
                                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">Nenhum depósito registrado ainda.</td></tr>
                                ) : (
                                    allDeposits.map(tx => {
                                        const user = users.find(u => u.id === tx.userId);
                                        return (
                                            <tr key={tx.id} className="hover:bg-dark-800/50">
                                                <td className="p-3 text-sm">{new Date(tx.date).toLocaleString()}</td>
                                                <td className="p-3 font-bold text-white">{user?.name || '---'} <span className='text-xs font-normal text-gray-500 block'>{user?.username}</span></td>
                                                <td className="p-3 font-mono text-neon-green font-bold">R$ {tx.amount.toFixed(2)}</td>
                                                <td className="p-3">
                                                    <Badge color={tx.status === 'COMPLETED' ? 'green' : tx.status === 'REJECTED' ? 'red' : 'yellow'}>
                                                        {tx.status === 'COMPLETED' ? 'Aprovado' : tx.status === 'PENDING' ? 'Pendente' : 'Recusado'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs text-gray-500 font-mono truncate max-w-[150px]">{tx.details}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="space-y-6">
            
            {pendingPwdRequests.length > 0 && (
                <Card className="border-red-500/50 animate-pulse">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500"><ShieldAlert size={20}/> Solicitações de Recuperação de Senha</h3>
                    <div className="space-y-2">
                        {pendingPwdRequests.map(req => (
                            <div key={req.id} className="bg-red-900/10 border border-red-900 p-3 rounded flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">{req.username}</p>
                                    <p className="text-sm text-gray-400">{req.email}</p>
                                    <p className="text-xs text-gray-500">{new Date(req.date).toLocaleString()}</p>
                                </div>
                                <Button variant="danger" className="text-sm py-1" onClick={() => openResetModal(req.userId, req.id)}>
                                    REDEFINIR SENHA
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Users size={20}/> Gestão de Usuários</h3>
                    <div className="text-right flex items-center gap-4">
                        <button onClick={refreshUserList} className="flex items-center gap-2 text-xs bg-dark-800 p-2 rounded hover:bg-dark-700">
                             <RefreshCw size={14} /> Atualizar Lista
                        </button>
                        <p className="text-sm text-gray-400">Total: <span className="text-white font-bold">{users.length}</span></p>
                    </div>
                </div>
                
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-dark-800 sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-3 text-sm text-gray-400">Nome / Email</th>
                        <th className="p-3 text-sm text-gray-400">Saldo</th>
                        <th className="p-3 text-sm text-gray-400">Ciclo (Vício)</th>
                        <th className="p-3 text-sm text-gray-400">Senha</th>
                        <th className="p-3 text-sm text-gray-400 text-right">Ações</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {users.map(u => (
                        <tr key={u.id} className={`hover:bg-dark-800/50 transition-colors ${u.isBlocked ? 'bg-red-900/10' : ''}`}>
                        <td className="p-3">
                            <div className="flex items-center gap-2">
                                {u.isBlocked && <Lock size={14} className="text-red-500" />}
                                <div>
                                    <p className={`font-bold ${u.isBlocked ? 'text-red-400 line-through' : 'text-white'}`}>
                                        {u.name} {u.role === 'ADMIN' && <Badge color="blue">ADM</Badge>}
                                    </p>
                                    <p className="text-xs text-gray-500">{u.username}</p>
                                    <p className="text-xs text-gray-600">{u.email}</p>
                                </div>
                            </div>
                        </td>
                        <td className="p-3 font-mono text-neon-green">R$ {u.balance.toFixed(2)}</td>
                        <td className="p-3 text-xs text-purple-400">
                            Passo: {u.spinCycleIndex || 0} / 15
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-600">
                            {u.role === 'ADMIN' ? '***' : u.password}
                        </td>
                        <td className="p-3 text-right">
                            {u.role !== 'ADMIN' && (
                                <div className="flex justify-end gap-2">
                                    <button 
                                        title="Mudar Senha"
                                        onClick={() => openResetModal(u.id)}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                                    >
                                        <KeyRound size={16} />
                                    </button>
                                    
                                    {u.isBlocked ? (
                                        <button 
                                            title="Desbloquear"
                                            onClick={() => adminUnblockUser(u.id)}
                                            className="p-2 bg-green-900/50 hover:bg-green-800 border border-green-800 rounded text-green-400"
                                        >
                                            <Unlock size={16} />
                                        </button>
                                    ) : (
                                        <button 
                                            title="Bloquear"
                                            onClick={() => adminBlockUser(u.id)}
                                            className="p-2 bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-800 rounded text-yellow-400"
                                        >
                                            <Lock size={16} />
                                        </button>
                                    )}
                                    
                                    <button 
                                        title="Excluir"
                                        onClick={() => handleDeleteUser(u.id, u.name)}
                                        className="p-2 bg-red-900/50 hover:bg-red-800 border border-red-800 rounded text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-800">
                    <h4 className="font-bold mb-2 text-sm text-gray-400">Adicionar Saldo Manualmente (Emergência)</h4>
                    <div className="flex gap-4">
                        <input 
                            className="bg-dark-800 border border-gray-700 rounded p-2 text-white text-sm flex-1" 
                            placeholder="Login ou Email exato do usuário" 
                            value={manualId}
                            onChange={e => setManualId(e.target.value)}
                        />
                        <input 
                            className="bg-dark-800 border border-gray-700 rounded p-2 text-white text-sm w-32" 
                            placeholder="Valor" 
                            type="number"
                            value={manualAmount}
                            onChange={e => setManualAmount(e.target.value)}
                        />
                        <Button onClick={() => {
                            const u = users.find(user => user.email === manualId || user.name === manualId || user.username === manualId);
                            if(u) {
                                addBalanceManual(u.id, parseFloat(manualAmount));
                                alert(`Adicionado R$ ${manualAmount} para ${u.name}`);
                                setManualId('');
                                setManualAmount('');
                            } else {
                                alert('Usuário não encontrado');
                            }
                        }} variant="secondary" className="py-2 text-sm">Adicionar</Button>
                    </div>
                </div>
            </Card>
        </div>
      )}

      {/* Modal de Mudar Senha */}
      {resetModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-dark-900 border border-gray-700 p-6 rounded-lg w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Alterar Senha do Usuário</h3>
                  <Input 
                    label="Nova Senha" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Digite a nova senha..."
                  />
                  <div className="flex gap-3 mt-4">
                      <Button fullWidth onClick={handleConfirmPasswordReset} variant="neon">Salvar</Button>
                      <Button fullWidth onClick={() => setResetModalOpen(false)} variant="secondary">Cancelar</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
