import React, { useState, useEffect } from 'react';
import { adminService, getImageUrl } from '../services/api';
import {
  ShieldCheck,
  Users,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Ban,
  TrendingUp,
  FileText,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('verifications'); // verifications, users, stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await adminService.getStats();
      if (statsRes.success) setStats(statsRes.stats);

      const pendRes = await adminService.getPendingVerifications();
      if (pendRes.success) setPendingProviders(pendRes.providers || []);

      const usersRes = await adminService.getUsers();
      if (usersRes.success) setUsersList(usersRes.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyProvider = async (id, status) => {
    try {
      await adminService.updateVerificationStatus(id, status);
      setSuccessMsg(`Provider verification ${status} successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update verification.');
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      const res = await adminService.toggleUserBan(userId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update user ban status.');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Admin Header */}
        <div className="bg-[#2B2621] rounded-3xl p-6 sm:p-8 text-[#FBF7F0] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b-4 border-[#C6511F]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#C6511F] text-white rounded-full text-xs font-heading font-extrabold uppercase tracking-wider">
                Admin Command HQ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Platform Moderation & Verification
            </h1>
            <p className="text-xs text-[#D6C7B2]">
              Approve provider ID documents, manage user accounts, and view live platform statistics.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="px-4 py-2.5 bg-[#FFFDF9]/10 hover:bg-[#FFFDF9]/20 text-[#FBF7F0] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border border-[#FFFDF9]/20"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Stats Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border-2 border-[#E8DFC9] text-center shadow-xs">
              <span className="text-xs text-[#8C8275] font-bold block">Total Users</span>
              <span className="text-xl font-heading font-extrabold text-[#2B2621]">{stats.totalUsers}</span>
            </div>
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border-2 border-[#E8DFC9] text-center shadow-xs">
              <span className="text-xs text-[#8C8275] font-bold block">Service Providers</span>
              <span className="text-xl font-heading font-extrabold text-[#C6511F]">{stats.totalProviders}</span>
            </div>
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border-2 border-[#E8DFC9] text-center shadow-xs">
              <span className="text-xs text-[#8C8275] font-bold block">Pending Verifications</span>
              <span className="text-xl font-heading font-extrabold text-[#E8A33D]">{stats.pendingVerifications}</span>
            </div>
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border-2 border-[#E8DFC9] text-center shadow-xs">
              <span className="text-xs text-[#8C8275] font-bold block">Total Bookings</span>
              <span className="text-xl font-heading font-extrabold text-[#5C7A5C]">{stats.totalBookings}</span>
            </div>
          </div>
        )}

        {/* Notifications */}
        {successMsg && (
          <div className="p-4 bg-[#EDF2ED] border border-[#C2D4C2] rounded-2xl text-xs text-[#425942] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5C7A5C]" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E8DFC9] pb-2">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'verifications'
                ? 'bg-[#C6511F] text-white shadow-xs'
                : 'bg-white text-[#6B6153] hover:bg-[#F2EBDC]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pending Verifications ({pendingProviders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-[#C6511F] text-white shadow-xs'
                : 'bg-white text-[#6B6153] hover:bg-[#F2EBDC]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts & Bans ({usersList.length})</span>
          </button>
        </div>

        {/* Tab 1: Verification Requests */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            {loading ? (
              <div className="h-40 bg-white rounded-3xl animate-pulse" />
            ) : pendingProviders.length === 0 ? (
              <div className="bg-[#FFFDF9] rounded-3xl p-12 text-center border-2 border-[#E8DFC9] space-y-3">
                <ShieldCheck className="w-10 h-10 text-[#5C7A5C] mx-auto" />
                <h3 className="text-base font-heading font-extrabold text-[#2B2621]">All Verifications Up to Date</h3>
                <p className="text-xs text-[#6B6153]">No pending provider verification documents waiting for review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingProviders.map((prov) => (
                  <div key={prov._id} className="bg-white rounded-3xl p-5 border-2 border-[#E8DFC9] shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase bg-[#F7EBE5] text-[#C6511F] px-2 py-0.5 rounded-md">
                          {prov.category}
                        </span>
                        <h4 className="font-heading font-extrabold text-base text-[#2B2621] mt-1">
                          {prov.businessName}
                        </h4>
                        <p className="text-xs text-[#8C8275]">Owner: {prov.userId?.name} ({prov.userId?.email})</p>
                      </div>
                      <span className="text-xs font-bold text-[#E8A33D] capitalize">
                        ● {prov.verificationStatus}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B6153] line-clamp-2">{prov.description}</p>
                    <p className="text-xs text-[#8C8275]">Address: {prov.address}</p>

                    {prov.verificationDoc && (
                      <div className="p-2.5 bg-[#FBF7F0] rounded-xl border border-[#E8DFC9] flex items-center justify-between text-xs">
                        <span className="font-bold text-[#2B2621] flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#C6511F]" /> Document Attached
                        </span>
                        <a
                          href={getImageUrl(prov.verificationDoc)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#C6511F] hover:underline"
                        >
                          View Document →
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-[#F2EBDC]">
                      <button
                        onClick={() => handleVerifyProvider(prov._id, 'approved')}
                        className="flex-1 py-2 bg-[#5C7A5C] hover:bg-[#485935] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Verify
                      </button>
                      <button
                        onClick={() => handleVerifyProvider(prov._id, 'rejected')}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: User Accounts & Bans */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-3xl border-2 border-[#E8DFC9] space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-heading font-extrabold text-base text-[#2B2621]">
                User Moderation Directory
              </h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#F2EBDC] rounded-xl text-xs text-[#2B2621] border border-[#E8DFC9]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8DFC9] text-[#8C8275] uppercase font-bold text-[10px]">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EBDC]">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-[#FBF7F0]">
                      <td className="py-3 px-3 font-bold text-[#2B2621]">{u.name}</td>
                      <td className="py-3 px-3 text-[#6B6153]">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-bold px-2 py-0.5 bg-[#F2EBDC] rounded-md text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {u.isBanned ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[10px]">
                            Banned
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleBan(u._id)}
                            className={`px-3 py-1 rounded-lg font-bold text-[11px] border ${
                              u.isBanned
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {u.isBanned ? 'Unban User' : 'Ban Account'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
