
import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Card, Button, Input, Badge } from '../components/ui/Components';
import { Copy, Check, ArrowUpRight, ArrowDownLeft, History, Loader2, Users, Trophy, MessageCircle, AlertTriangle, Key } from 'lucide-react';

// --- GERADOR DE PAYLOAD PIX (EMV) ---
class PixPayload {
  private key: string;
  private name: string;
  private city: string;
  private amount: string;
  private txId: string;

  constructor(key: string, amount: string, name: string = 'RACHAPIX', city: string = 'SAO PAULO', txId: string = '***') {
    this.key = key;
    this.amount = amount;
    this.name = this.normalize(name).substring(0, 25);
    this.city = this.normalize(city).substring(0, 15);
    this.txId = '***'; // FORÇAR *** PARA COMPATIBILIDADE TOTAL COM TODOS OS BANCOS
  }

  private normalize(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, "");
  }

  private formatField(id: string, value: string) {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  private getCRC16(payload: string) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
        else crc = crc << 1;
      }
      crc = crc & 0xFFFF; // Garante 16-bit
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  public generate(): string {
    const payload = [
      this.formatField('00', '01'), 
      this.formatField('26', [
        this.formatField('00', 'br.gov.bcb.pix'),
        this.formatField('01', this.key)
      ].join('')), 
      this.formatField('52', '0000'), 
      this.formatField('53', '986'), 
      this.formatField('54', Number(this.amount).toFixed(2)), 
      this.formatField('58', 'BR'), 
      this.formatField('59', this.name), 
      this.formatField('60', this.city), 
      this.formatField('62', this.formatField('05', this.txId)), 
      '6304' 
    ].join('');

    return `${payload}${this.getCRC16(payload)}`;
  }
}

export const Dashboard = () => {
  const { user, transactions } = useStore();
  const myTransactions = transactions.filter(t => t.userId === user?.id).slice(0, 5);

  const copyAffiliateLink = () => {
      const link = `https://rachapix.com/?ref=${user?.affiliateCode}`;
      navigator.clipboard.writeText(link);
      alert(`Link copiado: ${link}`);
  };

  return (
    <div className="space-y-8 relative">
      <h2 className="text-3xl font-bold brand-font">Bem-vindo, {user?.name}</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-neon-green/30 bg-gradient-to-br from-dark-900 to-green-900/10">
            <p className="text-gray-400 mb-1">Seu Saldo Disponível</p>
            <h3 className="text-4xl font-bold text-neon-green">R$ {user?.balance.toFixed(2)}</h3>
        </Card>
        <Card>
            <p className="text-gray-400 mb-1">Total Movimentado</p>
            <h3 className="text-4xl font-bold text-white">R$ {transactions.filter(t => t.userId === user?.id && t.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}</h3>
        </Card>
      </div>

      {/* Affiliate System */}
      <Card className="border-purple-500/30">
        <div className="flex items-center space-x-2 mb-4">
            <Users className="text-purple-400" />
            <h3 className="text-xl font-bold text-purple-400">Indique e Ganhe</h3>
        </div>
        <div className="bg-purple-900/20 p-4 rounded-lg mb-4 border border-purple-900/50">
            <p className="text-white font-bold">💰 Como funciona:</p>
            <p className="text-gray-300 text-sm">Convide amigos! Você ganha <span className="text-neon-green font-bold">R$ 3,00</span> automaticamente a cada depósito de R$ 10,00 que eles fizerem.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-dark-800 p-4 rounded-lg">
                 <p className="text-sm text-gray-400">Pessoas Indicadas</p>
                 <p className="text-2xl font-bold text-white">{user?.referralCount || 0}</p>
             </div>
             <div className="md:col-span-2 bg-dark-800 p-4 rounded-lg flex flex-col justify-center">
                 <p className="text-sm text-gray-400 mb-2">Seu Link de Convite</p>
                 <div className="flex items-center gap-4">
                     <span className="text-lg font-mono font-bold text-neon-green tracking-widest truncate max-w-[200px]">rachapix.com/?ref={user?.affiliateCode}</span>
                     <Button variant="secondary" className="py-2 px-4 text-xs" onClick={copyAffiliateLink}>
                        Copiar Link
                     </Button>
                 </div>
             </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center space-x-2 mb-6">
            <History className="text-neon-blue" />
            <h3 className="text-xl font-bold">Últimas Atividades</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="pb-3">Tipo</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {myTransactions.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">Nenhuma atividade recente.</td></tr>
              ) : (
                  myTransactions.map(t => (
                    <tr key={t.id} className="text-sm">
                      <td className="py-3">
                        <span className={`flex items-center ${t.type.includes('WIN') || t.type === 'DEPOSIT' || t.type === 'BONUS_AFFILIATE' ? 'text-green-400' : 'text-red-400'}`}>
                            {t.type === 'DEPOSIT' && <ArrowDownLeft size={14} className="mr-1"/>}
                            {t.type === 'WITHDRAW' && <ArrowUpRight size={14} className="mr-1"/>}
                            {t.type === 'BET_WIN' && '🏆 VITÓRIA'}
                            {t.type === 'BET_LOSS' && '💀 DERROTA'}
                            {t.type === 'BONUS_AFFILIATE' && '💰 BÔNUS INDICAÇÃO'}
                            {t.type === 'DEPOSIT' && 'DEPÓSITO'}
                            {t.type === 'WITHDRAW' && 'SAQUE'}
                        </span>
                      </td>
                      <td className="py-3 font-mono">R$ {t.amount.toFixed(2)}</td>
                      <td className="py-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-3">
                        <Badge color={t.status === 'COMPLETED' ? 'green' : t.status === 'REJECTED' ? 'red' : 'yellow'}>
                            {t.status === 'COMPLETED' ? 'Confirmado' : t.status === 'PENDING' ? 'Pendente' : 'Recusado'}
                        </Badge>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* BOTÃO FLUTUANTE DO WHATSAPP */}
      <a 
        href="https://wa.me/message/WJUOFWXMA6NFF1" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] z-50 flex items-center gap-3 animate-bounce transition-all hover:scale-105"
      >
          <MessageCircle size={28} />
          <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-bold uppercase text-green-100">Dúvidas?</span>
              <span className="font-bold text-sm">Suporte / Comprovante</span>
          </div>
      </a>
    </div>
  );
};

export const Deposit = () => {
  const { requestDeposit } = useStore();
  const [amount, setAmount] = useState('20');
  const [step, setStep] = useState<'INPUT' | 'PAYMENT' | 'CHECKING' | 'WAITING'>('INPUT');
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [currentTxId, setCurrentTxId] = useState('');
  
  const PIX_KEY = "2d469308-6536-4973-8ba1-e8c630b1c522";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKeyOnly = () => {
      navigator.clipboard.writeText(PIX_KEY);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
  }

  const handleGeneratePix = () => {
    const val = parseFloat(amount);
    if (!amount || val < 10) {
        alert("O depósito mínimo é R$ 10,00");
        return;
    }
    
    // Identificador único apenas para visualização interna
    const txIdentifier = 'RPX-' + Math.floor(Math.random() * 100000);
    setCurrentTxId(txIdentifier);

    // Gerar Payload Pix REAL (Compatível com Nubank, Inter, BB, etc)
    const payloadGen = new PixPayload(PIX_KEY, amount, 'RACHAPIX', 'SAO PAULO');
    const code = payloadGen.generate();
    setPixCode(code);
    setStep('PAYMENT');
  };

  const handleConfirmPayment = () => {
    const val = parseFloat(amount);
    // Envia para o Admin aprovar
    requestDeposit(val, `ID Pix: ${currentTxId}`);
    setStep('WAITING');
  };

  return (
    <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold brand-font text-center mb-6">Adicionar Saldo</h2>
        
        {step === 'INPUT' && (
             <Card>
                <label className="block text-sm text-gray-400 mb-2">Quanto você quer depositar? (Mínimo R$ 10)</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {['10', '20', '50'].map(val => (
                        <button key={val} onClick={() => setAmount(val)} className={`p-3 rounded border ${amount === val ? 'border-neon-green bg-neon-green/10 text-neon-green' : 'border-gray-700 bg-dark-800'}`}>
                            R$ {val}
                        </button>
                    ))}
                </div>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Outro valor..." />
                <Button fullWidth onClick={handleGeneratePix} variant="neon">GERAR PIX</Button>
                <p className="text-xs text-center text-gray-500 mt-2">Pagamento seguro via Pix Banco Central</p>
             </Card>
        )}

        {step === 'PAYMENT' && (
            <Card className="border-neon-green/50 shadow-[0_0_30px_rgba(57,255,20,0.1)] text-center animate-fadeIn">
                <div className="mb-4">
                    <p className="text-gray-400 text-sm">Pague exatamente:</p>
                    <p className="text-4xl font-bold text-white">R$ {parseFloat(amount).toFixed(2)}</p>
                </div>

                <div className="bg-white p-2 inline-block rounded-lg mb-4">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`} alt="QR Code Pix" className="w-56 h-56" />
                </div>

                <div className="space-y-4 mb-6">
                    {/* OPÇÃO 1: COPIA E COLA */}
                    <div className="bg-dark-800 p-3 rounded-lg border border-gray-700 flex flex-col gap-2 group cursor-pointer" onClick={handleCopyCode}>
                        <div className="flex justify-between items-center w-full">
                            <p className="text-xs text-neon-green font-bold">OPÇÃO 1: Pix Copia e Cola (Recomendado)</p>
                            <div className="text-white">
                                {copied ? <span className="text-green-500 text-xs font-bold">COPIADO!</span> : <Copy size={16}/>}
                            </div>
                        </div>
                        <p className="text-gray-400 font-mono text-xs break-all text-left truncate">{pixCode}</p>
                    </div>

                    {/* OPÇÃO 2: CHAVE ALEATÓRIA */}
                    <div className="bg-dark-800 p-3 rounded-lg border border-gray-700 flex flex-col gap-2 group cursor-pointer" onClick={handleCopyKeyOnly}>
                         <div className="flex justify-between items-center w-full">
                            <p className="text-xs text-white font-bold flex items-center gap-1"><Key size={12}/> OPÇÃO 2: Chave Aleatória (Manual)</p>
                            <div className="text-white">
                                {keyCopied ? <span className="text-green-500 text-xs font-bold">COPIADO!</span> : <Button variant='secondary' className='py-1 px-2 text-[10px] h-auto'>Copiar Chave</Button>}
                            </div>
                        </div>
                        <p className="text-gray-300 font-mono text-xs break-all text-left select-all">{PIX_KEY}</p>
                    </div>

                    <div className="bg-yellow-900/20 p-3 rounded text-sm text-yellow-200 border border-yellow-800/50">
                        ⚠️ Após pagar no banco, clique no botão abaixo para registrar.
                    </div>

                    <Button fullWidth variant="primary" onClick={handleConfirmPayment} className="animate-pulse">
                        JÁ FIZ O PIX
                    </Button>
                </div>
            </Card>
        )}

        {step === 'WAITING' && (
             <Card className="text-center py-8 border-yellow-500 bg-yellow-900/10 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 animate-pulse"></div>
                
                <div className="flex justify-center mb-6">
                    <div className="bg-red-600 rounded-full p-4 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-bounce">
                        <AlertTriangle className="w-12 h-12 text-white" />
                    </div>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 uppercase">Atenção Necessária!</h3>
                <p className="text-gray-200 font-bold mb-6 text-lg max-w-sm mx-auto leading-relaxed">
                    Para liberar seu saldo imediatamente, é <span className="text-red-500 bg-red-900/20 px-1">OBRIGATÓRIO</span> enviar o comprovante agora!
                </p>

                <div className="bg-dark-900/80 p-3 rounded border border-gray-700 inline-block mb-6">
                     <span className="text-xs text-gray-500 block">ID da Transação</span>
                     <span className="text-neon-green font-mono font-bold">{currentTxId}</span>
                </div>
                
                <div className="flex flex-col gap-3">
                    <a 
                        href="https://wa.me/message/WJUOFWXMA6NFF1" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-500 text-white py-4 px-6 rounded-lg font-black text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 transform hover:scale-105 transition-all"
                    >
                        <MessageCircle size={24} className="animate-pulse"/>
                        ENVIAR COMPROVANTE AGORA
                    </a>
                    <Button variant="secondary" onClick={() => setStep('INPUT')} className="text-xs text-gray-500 bg-transparent border-none hover:text-white">
                        Voltar ao início
                    </Button>
                </div>
            </Card>
        )}
    </div>
  );
};

export const Withdraw = () => {
  const { user, requestWithdraw } = useStore();
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [msg, setMsg] = useState('');

  const handleWithdraw = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || !pixKey) {
        setMsg('Preencha os dados corretamente.');
        return;
    }
    const success = requestWithdraw(val, pixKey);
    if (success) {
        setMsg('Solicitação enviada! O valor cairá na sua conta em até 2 horas.');
        setAmount('');
        setPixKey('');
    } else {
        setMsg('Erro: Saldo insuficiente, limite diário atingido ou mínimo de R$ 10 não alcançado.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
        <Card>
            <h2 className="text-2xl font-bold mb-6 text-neon-blue brand-font text-center">Sacar Prêmio</h2>
            <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Saldo Disponível:</span>
                    <span className="text-white font-bold">R$ {user?.balance.toFixed(2)}</span>
                </div>

                <Input label="Chave Pix de Destino" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, Email ou Aleatória" />
                <Input label="Valor do Saque (Mínimo R$ 10,00)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                
                <div className="text-xs text-gray-500 text-right">
                     Limite Diário Restante: <span className="text-neon-green">R$ {Math.max(0, 2000 - (user?.dailyWithdrawTotal || 0)).toFixed(2)}</span>
                </div>

                {msg && <p className={`text-sm text-center ${msg.includes('Erro') ? 'text-red-500' : 'text-green-500'}`}>{msg}</p>}
                
                <Button fullWidth onClick={handleWithdraw} variant="primary" className="bg-neon-blue hover:bg-cyan-500 text-black shadow-cyan-900/50">
                    SOLICITAR SAQUE
                </Button>
                
                <p className="text-xs text-center text-gray-500 mt-4">
                    Prazo de processamento: Até 2 horas úteis. <br/>
                    Limite de R$ 2.000,00 por dia.
                </p>
            </div>
        </Card>
    </div>
  );
};
