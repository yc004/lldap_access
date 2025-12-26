import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ShieldCheck, History } from 'lucide-react';

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const { register: registerProfile, handleSubmit: handleProfile, reset: resetProfile } = useForm();
  const { register: registerPass, handleSubmit: handlePass, reset: resetPass } = useForm();
  const { register: register2FA, handleSubmit: handle2FA, reset: reset2FA } = useForm();

  useEffect(() => {
    loadProfile();
    loadLogs();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await client.get('/user/profile');
      setProfile(res.data);
      resetProfile(res.data);
    } catch (e) { console.error(e); }
  };

  const loadLogs = async () => {
    try {
      const res = await client.get('/user/logs');
      setLogs(res.data);
    } catch (e) { console.error(e); }
  };

  const onUpdateProfile = async (data: any) => {
    try {
      await client.put('/user/profile', data);
      toast.success('资料已更新');
      loadProfile();
    } catch (e: any) {
      toast.error(e.response?.data?.message || '更新失败');
    }
  };

  const onChangePassword = async (data: any) => {
    try {
      await client.post('/user/password', data);
      toast.success('密码修改成功');
      resetPass();
    } catch (e: any) {
      toast.error(e.response?.data?.message || '密码修改失败');
    }
  };

  const onSetup2FA = async () => {
    try {
      const res = await client.post('/user/2fa/setup');
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
    } catch (e: any) {
      toast.error('2FA 设置失败');
    }
  };

  const onEnable2FA = async (data: any) => {
    try {
      await client.post('/user/2fa/enable', { secret, code: data.code });
      toast.success('2FA 已启用');
      setQrCode(null);
      setSecret(null);
      reset2FA();
    } catch (e: any) {
      toast.error(e.response?.data?.message || '2FA 启用失败');
    }
  };

  if (!profile) return <div>加载中...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">我的账户</h2>
      
      <div role="tablist" className="tabs tabs-boxed mb-6 w-fit">
        <a role="tab" className={`tab ${activeTab === 'profile' ? 'tab-active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User className="w-4 h-4 mr-2" /> 个人资料
        </a>
        <a role="tab" className={`tab ${activeTab === 'security' ? 'tab-active' : ''}`} onClick={() => setActiveTab('security')}>
          <ShieldCheck className="w-4 h-4 mr-2" /> 安全设置
        </a>
        <a role="tab" className={`tab ${activeTab === 'logs' ? 'tab-active' : ''}`} onClick={() => setActiveTab('logs')}>
          <History className="w-4 h-4 mr-2" /> 活动日志
        </a>
      </div>

      <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-200">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfile(onUpdateProfile)} className="space-y-4 max-w-lg">
            <div className="form-control">
              <label className="label">用户名</label>
              <input type="text" value={profile.uid} disabled className="input input-bordered" />
            </div>
            <div className="form-control">
              <label className="label">显示名称</label>
              <input {...registerProfile('displayName')} type="text" className="input input-bordered" />
            </div>
            <div className="form-control">
              <label className="label">邮箱</label>
              <input {...registerProfile('mail')} type="email" className="input input-bordered" />
            </div>
            <button className="btn btn-primary mt-4">保存更改</button>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center"><Lock className="w-5 h-5 mr-2" /> 修改密码</h3>
              <form onSubmit={handlePass(onChangePassword)} className="space-y-4">
                <div className="form-control">
                  <label className="label">当前密码</label>
                  <input {...registerPass('currentPassword')} type="password" className="input input-bordered" />
                </div>
                <div className="form-control">
                  <label className="label">新密码</label>
                  <input {...registerPass('newPassword')} type="password" className="input input-bordered" />
                </div>
                <button className="btn btn-warning mt-4">更新密码</button>
              </form>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center"><ShieldCheck className="w-5 h-5 mr-2" /> 双重验证 (2FA)</h3>
              {!qrCode ? (
                <button onClick={onSetup2FA} className="btn btn-outline">设置 2FA</button>
              ) : (
                <div className="space-y-4">
                  <img src={qrCode} alt="2FA QR" className="border rounded-lg" />
                  <p className="text-sm">请使用 Google Authenticator 扫描</p>
                  <form onSubmit={handle2FA(onEnable2FA)} className="flex gap-2">
                    <input {...register2FA('code')} type="text" placeholder="123456" className="input input-bordered w-32" />
                    <button className="btn btn-success">验证并启用</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作</th>
                  <th>详情</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><div className="badge badge-ghost">{log.action}</div></td>
                    <td>{log.details}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={3} className="text-center">暂无日志</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
