import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Lock, User, KeyRound } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onSubmitCredentials = async (data: any) => {
    setLoading(true);
    try {
      const res = await client.post('/auth/login', data);
      if (res.data.require2fa) {
        setTempToken(res.data.tempToken);
        setStep('2fa');
        toast.info('请输入您的 2FA 验证码');
      } else {
        login(res.data.token, res.data.user);
        toast.success('欢迎回来！');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit2FA = async (data: any) => {
    setLoading(true);
    try {
      const res = await client.post('/auth/2fa/verify', {
        tempToken,
        code: data.code
      });
      login(res.data.token, res.data.user);
      toast.success('欢迎回来！');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-4">LLDAP 管理系统</h2>
          
          {step === 'credentials' ? (
            <form onSubmit={handleSubmit(onSubmitCredentials)} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">用户名</span></label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input 
                    {...register('username', { required: true })}
                    type="text" 
                    placeholder="请输入用户名" 
                    className="input input-bordered w-full pl-10" 
                  />
                </div>
                {errors.username && <span className="text-error text-sm">必填项</span>}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">密码</span></label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input 
                    {...register('password', { required: true })}
                    type="password" 
                    placeholder="请输入密码" 
                    className="input input-bordered w-full pl-10" 
                  />
                </div>
                {errors.password && <span className="text-error text-sm">必填项</span>}
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit2FA)} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">2FA 验证码</span></label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input 
                    {...register('code', { required: true, minLength: 6 })}
                    type="text" 
                    placeholder="123456" 
                    className="input input-bordered w-full pl-10 tracking-widest text-center text-lg" 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? '验证中...' : '验证'}
              </button>
              <button 
                type="button" 
                onClick={() => setStep('credentials')} 
                className="btn btn-ghost w-full btn-sm"
              >
                返回登录
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
