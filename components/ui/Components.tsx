import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  fullWidth = false
}: { 
  children?: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'neon'; 
  className?: string; 
  disabled?: boolean;
  fullWidth?: boolean;
}) => {
  const baseClasses = "px-6 py-3 rounded-lg font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50",
    outline: "border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black",
    neon: "bg-neon-green text-black hover:bg-white hover:shadow-[0_0_20px_#39ff14] shadow-[0_0_10px_#39ff14]"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder 
}: { 
  label?: string; 
  type?: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string; 
}) => (
  <div className="mb-4 w-full">
    {label && <label className="block text-gray-400 text-sm mb-2">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-dark-800 border border-gray-700 text-white rounded-lg p-3 focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
    />
  </div>
);

export const Card = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <div className={`bg-dark-900 border border-gray-800 rounded-2xl p-6 shadow-2xl ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, color = 'green' }: { children?: React.ReactNode; color?: 'green' | 'red' | 'yellow' | 'blue' }) => {
  const colors = {
    green: 'bg-green-900/50 text-green-400 border-green-800',
    red: 'bg-red-900/50 text-red-400 border-red-800',
    yellow: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    blue: 'bg-blue-900/50 text-blue-400 border-blue-800',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs border ${colors[color]}`}>
      {children}
    </span>
  );
};