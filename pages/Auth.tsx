
import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Button, Input, Card } from '../components/ui/Components';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const Login = () => {
  const { login, setView, requestPasswordReset } = useStore();
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const [identifier, setIdentifier] = useState(''); // Pode ser Username ou Email
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const cleanId = identifier.trim();
    const cleanPass = pass.trim();

    const result = await login(cleanId, cleanPass, remember, isAdminMode);
    if (!result.success) {
        setError(result.msg || 'Credenciais inválidas.');
    }
    setLoading(false);
  };

  const handleResetRequest = () => {
      if (!resetEmail) {
          alert("Digite seu e-mail.");
          return;
      }
      const sent = requestPasswordReset(resetEmail);
      if (sent) {
          alert("Solicitação enviada! O administrador entrará em contato ou redefinirá sua senha em breve.");
          setShowResetModal(false);
          setResetEmail('');
      } else {
          alert("E-mail não encontrado em nossa base de dados.");
      }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card className={`transition-all duration-500 ${isAdminMode ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]' : ''}`}>
        
        {isAdminMode && (
             <div className="flex items-center justify-center gap-2 mb-4 text-red-500 animate-pulse">
                 <ShieldAlert size={24} />
                 <span className="font-bold tracking-widest">ÁREA ADMINISTRATIVA</span>
             </div>
        )}

        <h2 className={`text-2xl font-bold text-center mb-6 brand-font ${isAdminMode ? 'text-red-500' : 'text-neon-green'}`}>
            {isAdminMode ? 'LOGIN STAFF' : 'ENTRAR'}
        </h2>

        <div className="space-y-4">
          <Input 
            label={isAdminMode ? "Usuário Admin" : "Usuário ou E-mail"} 
            value={identifier} 
            onChange={(e) => setIdentifier(e.target.value)} 
            placeholder={isAdminMode ? "admin" : "Digite seu usuário..."}
          />
          <Input 
            label="Senha" 
            type="password" 
            value={pass} 
            onChange={(e) => setPass(e.target.value)} 
            placeholder="******" 
          />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 bg-dark-800 p-2 rounded border border-gray-700">
                <input 
                type="checkbox" 
                id="remember" 
                checked={remember} 
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-dark-900 text-neon-green focus:ring-neon-green"
                />
                <label htmlFor="remember" className="text-sm text-gray-300 cursor-pointer select-none font-medium">Lembrar</label>
            </div>
            {!isAdminMode && (
                <button onClick={() => setShowResetModal(true)} className="text-xs text-neon-blue hover:underline">
                    Esqueceu a senha?
                </button>
            )}
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-800 animate-pulse">{error}</p>}
          
          <Button 
            fullWidth 
            variant={isAdminMode ? 'danger' : 'neon'} 
            onClick={handleLogin} 
            disabled={loading}
          >
            {loading ? 'Verificando...' : (isAdminMode ? 'ACESSAR PAINEL' : 'ENTRAR')}
          </Button>
          
          {!isAdminMode && (
            <div className="text-center mt-4">
                <span className="text-gray-400 text-sm">Não tem conta? </span>
                <button onClick={() => setView('REGISTER')} className="text-neon-blue text-sm hover:underline">Cadastre-se</button>
            </div>
          )}

          <div className="border-t border-gray-800 mt-6 pt-4 flex justify-center">
              {isAdminMode ? (
                  <button onClick={() => setIsAdminMode(false)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
                      <ArrowLeft size={14} /> Voltar para Login de Jogador
                  </button>
              ) : (
                  <button onClick={() => setIsAdminMode(true)} className="flex items-center gap-2 text-dark-800 hover:text-gray-600 text-xs transition-colors p-2 rounded hover:bg-dark-800/50">
                      <Lock size={12} /> Acesso Administrativo
                  </button>
              )}
          </div>
        </div>
      </Card>

      {/* Modal Esqueci a Senha */}
      {showResetModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-dark-900 border border-gray-700 p-6 rounded-lg w-full max-w-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Recuperar Acesso</h3>
                  <p className="text-sm text-gray-400 mb-4">Digite seu e-mail cadastrado. Enviaremos uma solicitação para a administração redefinir sua senha.</p>
                  <Input 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    placeholder="seu@email.com" 
                  />
                  <div className="flex gap-3 mt-4">
                      <Button fullWidth onClick={handleResetRequest} variant="neon">Solicitar</Button>
                      <Button fullWidth onClick={() => setShowResetModal(false)} variant="secondary">Cancelar</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export const Register = () => {
  const { register, setView } = useStore();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
        setReferral(refCode);
    }
  }, []);

  const handleRegister = async () => {
    if (!username || !name || !email || !pass) {
        setError('Preencha todos os campos obrigatórios.');
        return;
    }
    setLoading(true);
    setError('');
    
    const success = await register(username, email, name, pass, referral);
    if (!success) setError('Este nome de usuário ou email já existe.');
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <h2 className="text-2xl font-bold text-center mb-6 text-neon-green brand-font">CRIAR CONTA</h2>
        <div className="space-y-4">
          <Input label="Usuário (Login)" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ex: joao123" />
          <Input label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
          <Input label="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          <Input label="Senha" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="******" />
          
          {/* Campo de Afiliado Automático e Oculto (Visualmente limpo) */}
          {referral && (
              <div className="text-center text-xs text-green-500 bg-green-900/20 p-2 rounded border border-green-800">
                  Código de convite aplicado com sucesso!
              </div>
          )}
          
          {error && <p className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-800">{error}</p>}
          
          <Button fullWidth variant="neon" onClick={handleRegister} disabled={loading}>
            {loading ? 'Criando...' : 'CADASTRAR'}
          </Button>

          <div className="text-center mt-4">
            <span className="text-gray-400 text-sm">Já tem conta? </span>
            <button onClick={() => setView('LOGIN')} className="text-neon-blue text-sm hover:underline">Entrar</button>
          </div>
        </div>
      </Card>
    </div>
  );
};
