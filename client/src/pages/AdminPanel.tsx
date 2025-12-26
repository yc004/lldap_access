 import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import client from '../api/client';
import { Users, Upload, Trash2, Search, Plus, Edit2 } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const { register, handleSubmit, reset } = useForm();
  const { register: registerNew, handleSubmit: handleNew, reset: resetNew } = useForm();
  const { register: registerEdit, handleSubmit: handleEdit, reset: resetEdit, setValue: setEditValue } = useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const query = filter ? `?filter=(|(uid=*${filter}*)(cn=*${filter}*)(mail=*${filter}*))` : '';
      const res = await client.get(`/admin/users${query}`);
      setUsers(res.data);
    } catch (e) { console.error(e); }
  };

  const onDeleteUser = async (uid: string) => {
    if (!confirm(`确认要删除用户 ${uid} 吗?`)) return;
    try {
      await client.delete(`/admin/users/${uid}`);
      toast.success('用户已删除');
      loadUsers();
    } catch (e: any) {
      toast.error('删除失败');
    }
  };

  const onImport = async (data: any) => {
    const formData = new FormData();
    formData.append('file', data.file[0]);
    try {
      const res = await client.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      loadUsers();
    } catch (e: any) {
      toast.error('导入失败');
    }
  };

  const onCreateUser = async (data: any) => {
    try {
      await client.post('/admin/users', data);
      toast.success('用户创建成功');
      resetNew();
      loadUsers();
      (document.getElementById('create_modal') as any).close();
    } catch (e: any) {
      toast.error(e.response?.data?.message || '创建失败');
    }
  };

  const onUpdateUser = async (data: any) => {
    try {
      await client.put(`/admin/users/${editingUser.uid}`, data);
      toast.success('用户信息更新成功');
      setEditingUser(null);
      loadUsers();
      (document.getElementById('edit_modal') as any).close();
    } catch (e: any) {
      toast.error(e.response?.data?.message || '更新失败');
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditValue('cn', user.cn || user.displayName);
    setEditValue('mail', user.mail || user.email);
    setEditValue('password', ''); // Reset password field
    (document.getElementById('edit_modal') as any).showModal();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">管理控制台</h2>

      <div role="tablist" className="tabs tabs-boxed mb-6 w-fit">
        <a role="tab" className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users className="w-4 h-4 mr-2" /> 用户管理
        </a>
        <a role="tab" className={`tab ${activeTab === 'import' ? 'tab-active' : ''}`} onClick={() => setActiveTab('import')}>
          <Upload className="w-4 h-4 mr-2" /> 批量导入
        </a>
      </div>

      <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-200">
        {activeTab === 'users' && (
          <>
            <div className="flex justify-between mb-4">
              <div className="join">
                <input 
                  className="input input-bordered join-item" 
                  placeholder="搜索..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <button className="btn join-item btn-neutral" onClick={loadUsers}><Search className="w-4 h-4" /></button>
              </div>
              <button className="btn btn-primary" onClick={()=>(document.getElementById('create_modal') as any).showModal()}>
                <Plus className="w-4 h-4 mr-2" /> 新增用户
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>用户名 (UID)</th>
                    <th>显示名称</th>
                    <th>邮箱</th>
                    <th>所属组</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users && users.filter((u: any) => u).map((u: any) => (
                    <tr key={u.dn || u.uid || Math.random()}>
                      <td className="font-mono text-xs">{u.uid || 'N/A'}</td>
                      <td>{u.cn || u.displayName || 'N/A'}</td>
                      <td>{u.mail || u.email || 'N/A'}</td>
                      <td className="max-w-xs truncate text-xs text-gray-500">
                        {(u.groups && u.groups.length > 0)
                          ? u.groups.map((g:any) => g.displayName).join(', ')
                          : (Array.isArray(u.memberOf) ? u.memberOf.join(', ') : (u.memberOf || ''))}
                      </td>
                      <td className="flex gap-2">
                        {u.uid && (
                          <>
                            <button className="btn btn-ghost btn-xs text-info" onClick={() => openEditModal(u)}>
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="btn btn-ghost btn-xs text-error" onClick={() => onDeleteUser(u.uid)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create Modal */}
            <dialog id="create_modal" className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">创建新用户</h3>
                <form onSubmit={handleNew(onCreateUser)} className="space-y-4">
                  <div className="form-control">
                    <label className="label">用户名 (UID)</label>
                    <input {...registerNew('uid', { required: true })} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label">显示名称</label>
                    <input {...registerNew('cn', { required: true })} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label">邮箱</label>
                    <input {...registerNew('mail', { required: true })} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label">密码</label>
                    <input {...registerNew('password', { required: true })} type="password" className="input input-bordered" />
                  </div>
                  <div className="modal-action">
                    <button type="button" className="btn" onClick={()=>(document.getElementById('create_modal') as any).close()}>取消</button>
                    <button className="btn btn-primary">创建</button>
                  </div>
                </form>
              </div>
            </dialog>

            {/* Edit Modal */}
            <dialog id="edit_modal" className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">编辑用户: {editingUser?.uid}</h3>
                <form onSubmit={handleEdit(onUpdateUser)} className="space-y-4">
                  <div className="form-control">
                    <label className="label">显示名称</label>
                    <input {...registerEdit('cn', { required: true })} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label">邮箱</label>
                    <input {...registerEdit('mail', { required: true })} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label">新密码 <span className="text-xs text-gray-500 font-normal">(留空保持不变)</span></label>
                    <input {...registerEdit('password')} type="password" className="input input-bordered" placeholder="••••••••" />
                  </div>
                  <div className="modal-action">
                    <button type="button" className="btn" onClick={()=>(document.getElementById('edit_modal') as any).close()}>取消</button>
                    <button className="btn btn-primary">保存更改</button>
                  </div>
                </form>
              </div>
            </dialog>
          </>
        )}

        {activeTab === 'import' && (
          <div className="max-w-md">
            <h3 className="text-xl font-bold mb-4">批量导入用户</h3>
            <div className="alert alert-info mb-6 text-sm">
              <span className="font-bold">操作指南:</span>
              <ul className="list-disc list-inside">
                <li>请上传包含以下表头的 CSV 文件: <code>uid, mail, cn, password</code></li>
                <li>下载 <a href="/template.csv" download className="link font-bold underline">template.csv</a> 模板文件作为参考。</li>
              </ul>
            </div>
            <form onSubmit={handleSubmit(onImport)} className="space-y-4">
              <input {...register('file', { required: true })} type="file" className="file-input file-input-bordered w-full" accept=".csv" />
              <button className="btn btn-primary w-full">上传并处理</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
