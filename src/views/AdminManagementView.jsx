import React, { useState, useEffect } from 'react';
import {
    Users, Building2, ShieldCheck, Mail, Trash2, Edit3, Search, PlusCircle, Settings, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { docService } from '../services/docService';

const AdminManagementView = () => {
    const [activeTab, setActiveTab] = useState('config'); // config, users, departments
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Config states
    const [emailNotif, setEmailNotif] = useState(true);
    const [slaEnforce, setSlaEnforce] = useState(true);
    const [slaThreshold, setSlaThreshold] = useState(48);
    const [auditNotes, setAuditNotes] = useState('');

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [u, d] = await Promise.all([
                docService.getUsers(),
                docService.getDepartments()
            ]);
            setUsers(u);
            setDepartments(d);
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleSaveConfig = () => {
        alert(`System configuration changes authorized. Change record logged in Audit Ledger with note: "${auditNotes || 'System parameter update'}"`);
        setAuditNotes('');
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading System governance...</span>
            </div>
        </div>
    );

    // Filter list by search term
    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDepts = departments.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => { setActiveTab(id); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all select-none ${
                activeTab === id
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
            
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200/80 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none shrink-0">
                <div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                        <span>Governance</span>
                        <span>/</span>
                        <span className="text-slate-600">Infrastructure</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight flex items-center gap-2">
                        Admin & System Management
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 bg-emerald/5 text-emerald px-2 py-0.5 rounded text-[9px] font-black border border-emerald/10 uppercase tracking-widest">
                            <ShieldCheck size={12} className="fill-emerald/20" /> SOC 2 COMPLIANT
                        </span>
                        <p className="text-xs text-slate-500 font-medium">Global system settings, encryption controls, and access rights</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchAdminData}
                        className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                        title="Reload Directory"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95">
                        <PlusCircle size={18} /> Create Account
                    </button>
                </div>
            </header>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Tabs selection */}
                <div className="flex border-b border-slate-200 bg-white rounded-lg shadow-sm px-4 select-none">
                    <TabButton id="config" label="System Configuration" icon={Settings} />
                    <TabButton id="users" label="User Directory" icon={Users} />
                    <TabButton id="departments" label="Departments" icon={Building2} />
                </div>

                {/* Simulated Content */}
                {activeTab === 'config' && (
                    <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden select-none animate-in fade-in duration-300">
                        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Settings size={14} className="text-slate-400" />
                                Global Core Parameters
                            </h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Toggle Switches */}
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 pr-6">
                                        <label className="text-sm font-bold text-slate-700">Email Notifications</label>
                                        <p className="text-xs text-slate-450 leading-relaxed font-medium">Automated status changes, return notifications, and sign reminders sent to stakeholders.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={emailNotif} 
                                            onChange={() => setEmailNotif(!emailNotif)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer-focus:outline-none transition-all duration-300 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 pr-6">
                                        <label className="text-sm font-bold text-slate-700">SLA Enforcement Alerts</label>
                                        <p className="text-xs text-slate-450 leading-relaxed font-medium">Flag and alert workflow items exceeding completion limits, triggering red flags in critical dashboards.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={slaEnforce} 
                                            onChange={() => setSlaEnforce(!slaEnforce)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer-focus:outline-none transition-all duration-300 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">SLA Threshold Duration (Hours)</label>
                                    <div className="relative max-w-[200px]">
                                        <input 
                                            type="number" 
                                            value={slaThreshold} 
                                            onChange={(e) => setSlaThreshold(parseInt(e.target.value) || 0)}
                                            className="w-full pl-3 pr-12 py-2 border border-slate-250 rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary/55 outline-none text-xs font-semibold text-slate-750" 
                                        />
                                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[9px] font-black text-slate-400 uppercase tracking-wide">HRS</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Audit Trail Reason Notes</label>
                                    <textarea 
                                        value={auditNotes}
                                        onChange={(e) => setAuditNotes(e.target.value)}
                                        placeholder="Explain the authorization basis for this configuration change..."
                                        className="w-full p-3 border border-slate-250 rounded-lg focus:ring-4 focus:ring-primary/5 focus:outline-none text-xs h-24 resize-none text-slate-750 font-medium" 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={handleSaveConfig}
                                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors shadow"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden select-none animate-in fade-in duration-300 flex flex-col">
                        <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Users size={14} className="text-slate-400" />
                                Governance Directory
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" size={14} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filter by name or email..."
                                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs w-full sm:w-60 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-medium bg-white"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                                        <th className="px-6 py-3.5">Name & Email</th>
                                        <th className="px-6 py-3.5">Department</th>
                                        <th className="px-6 py-3.5">Workflow Role</th>
                                        <th className="px-6 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.user_id} className="hover:bg-slate-50/25 transition-all group">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8.5 h-8.5 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold text-xs border border-primary/10">
                                                        {user.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800">{user.full_name}</div>
                                                        <div className="text-[10px] text-slate-450 font-medium mt-0.5 flex items-center gap-1">
                                                            <Mail size={10} /> {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-xs text-slate-650 font-semibold">{user.department}</span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border rounded-full ${
                                                    user.role === 'Admin'
                                                        ? 'bg-ruby/5 border-ruby/25 text-ruby'
                                                        : 'bg-primary/5 border-primary/20 text-primary'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-primary transition-all">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-ruby transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'departments' && (
                    <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden select-none animate-in fade-in duration-300 flex flex-col">
                        <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={14} className="text-slate-400" />
                                Enterprise Departments
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" size={14} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filter departments..."
                                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs w-full sm:w-60 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-medium bg-white"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                                        <th className="px-6 py-3.5">Department Name</th>
                                        <th className="px-6 py-3.5">Governance Code</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDepts.map((dept) => (
                                        <tr key={dept.dept_id} className="hover:bg-slate-50/25 transition-all group">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8.5 h-8.5 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800">{dept.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="font-mono text-xs text-slate-450 font-bold uppercase">DEPT-{dept.dept_id.toString().padStart(4, '0')}</span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="px-2 py-0.5 bg-emerald/5 border border-emerald/20 text-emerald text-[9px] font-black rounded-full uppercase tracking-wider">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-primary transition-all">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-ruby transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
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

export default AdminManagementView;
