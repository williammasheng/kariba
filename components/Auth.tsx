import React, { useState } from 'react';
import { loginUser, registerUser, resetPasswordRequest } from '../services/storage';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(username, password);
        if (res.success && res.user) {
          onLogin(res.user);
        } else {
          setError(res.message);
        }
      } else if (mode === 'register') {
        if (!username || !password || !email) {
          setError('请填写所有字段');
          setIsLoading(false);
          return;
        }
        const res = await registerUser(username, email, password);
        if (res.success) {
          setSuccess('注册成功！请登录。');
          setMode('login');
          setPassword('');
        } else {
          setError(res.message);
        }
      } else if (mode === 'forgot') {
        if (!email) {
          setError('请输入您的注册邮箱');
          setIsLoading(false);
          return;
        }
        const res = await resetPasswordRequest(email);
        if (res.success) {
          setSuccess(res.message);
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError('发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-center mb-6">
          KARIBA
        </h1>
        
        <h2 className="text-xl text-white font-bold mb-4 text-center">
          {mode === 'login' && '账号登录'}
          {mode === 'register' && '新用户注册'}
          {mode === 'forgot' && '找回密码'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'forgot' && (
            <div>
              <label className="block text-slate-400 text-sm mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {(mode === 'register' || mode === 'forgot') && (
             <div>
              <label className="block text-slate-400 text-sm mb-1">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="block text-slate-400 text-sm mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {error && <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</div>}
          {success && <div className="text-emerald-400 text-sm bg-emerald-900/20 p-2 rounded">{success}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '处理中...' : (
              <>
                {mode === 'login' && '进入游戏'}
                {mode === 'register' && '立即注册'}
                {mode === 'forgot' && '发送重置链接'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-between text-sm text-slate-500">
          {mode === 'login' && (
            <>
              <button onClick={() => {setMode('forgot'); setError(''); setSuccess('');}} className="hover:text-slate-300">忘记密码?</button>
              <button onClick={() => {setMode('register'); setError(''); setSuccess('');}} className="hover:text-slate-300">注册新账户</button>
            </>
          )}
          {mode === 'register' && (
            <button onClick={() => {setMode('login'); setError(''); setSuccess('');}} className="hover:text-slate-300 w-full text-center">返回登录</button>
          )}
          {mode === 'forgot' && (
            <button onClick={() => {setMode('login'); setError(''); setSuccess('');}} className="hover:text-slate-300 w-full text-center">返回登录</button>
          )}
        </div>
      </div>
    </div>
  );
};