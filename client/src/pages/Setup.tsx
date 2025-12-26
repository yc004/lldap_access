import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-toastify';

export default function Setup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ldapUrl: 'ldap://192.168.106.1:3890',
    ldapBindDN: 'cn=admin,ou=people,dc=example,dc=com',
    ldapBindPassword: '',
    ldapBaseDN: 'dc=example,dc=com',
    ldapUserSearchBase: 'ou=people,dc=example,dc=com',
    ldapGroupSearchBase: 'ou=groups,dc=example,dc=com',
    lldapBaseUrl: 'http://localhost:17170',
    lldapUsername: 'admin',
    lldapPassword: ''
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
        const { data } = await client.get('/setup/status');
        if (data.isConfigured) {
            navigate('/login');
        }
    } catch (error) {
        console.error('Failed to check status', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await client.post('/setup', formData);
        toast.success('Configuration saved successfully!');
        navigate('/login');
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Setup failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Initial System Configuration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please configure your LDAP and LLDAP connection details.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <div className="rounded-md shadow-sm -space-y-px">
            <h3 className="text-lg font-medium text-gray-900 mb-4">LDAP Settings</h3>
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">LDAP URL</label>
                    <input name="ldapUrl" type="text" required className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.ldapUrl} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Bind DN</label>
                    <input name="ldapBindDN" type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.ldapBindDN} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Bind Password</label>
                    <input name="ldapBindPassword" type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.ldapBindPassword} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Base DN</label>
                    <input name="ldapBaseDN" type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.ldapBaseDN} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">User Search Base</label>
                    <input name="ldapUserSearchBase" type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.ldapUserSearchBase} onChange={handleChange} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Group Search Base</label>
                    <input name="ldapGroupSearchBase" type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.ldapGroupSearchBase} onChange={handleChange} />
                </div>
            </div>
          </div>

          <div className="rounded-md shadow-sm -space-y-px mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">LLDAP Settings (For Management)</h3>
             <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">LLDAP Base URL</label>
                    <input name="lldapBaseUrl" type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.lldapBaseUrl} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Username</label>
                    <input name="lldapUsername" type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.lldapUsername} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Password</label>
                    <input name="lldapPassword" type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.lldapPassword} onChange={handleChange} />
                </div>
             </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Validating & Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
