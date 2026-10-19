import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, LogIn, Lock, Mail, ChevronRight } from 'lucide-react';

// Temp credential cards (mirrored from DB seed)
const DEMO_USERS = [
    { id: null,  role: 'Author',   badge: 'bg-violet-500',   users: [
        { id: 1,  name: 'Alice Carter',   email: 'alice@docsigner.corp',  pass: 'temp123', dept: 'Finance' },
        { id: 2,  name: 'Brian Okonkwo',  email: 'brian@docsigner.corp',  pass: 'temp456', dept: 'Legal' },
    ]},
    { id: null,  role: 'Reviewer', badge: 'bg-amber-500',    users: [
        { id: 3,  name: 'Clara Singh',    email: 'clara@docsigner.corp',  pass: 'rev001',  dept: 'HR' },
        { id: 4,  name: 'David Park',     email: 'david@docsigner.corp',  pass: 'rev002',  dept: 'Finance' },
        { id: 5,  name: 'Elena Vasquez',  email: 'elena@docsigner.corp',  pass: 'rev003',  dept: 'Legal' },
        { id: 6,  name: 'Farouk Hassan',  email: 'farouk@docsigner.corp', pass: 'rev004',  dept: 'Compliance' },
    ]},
    { id: null,  role: 'Approver', badge: 'bg-emerald-500',  users: [
        { id: 7,  name: 'Grace Liu',      email: 'grace@docsigner.corp',  pass: 'app001',  dept: 'Engineering' },
        { id: 8,  name: 'Henry Mbeki',    email: 'henry@docsigner.corp',  pass: 'app002',  dept: 'Operations' },
        { id: 9,  name: 'Isabel Torres',  email: 'isabel@docsigner.corp', pass: 'app003',  dept: 'Compliance' },
    ]},
    { id: null,  role: 'Admin',    badge: 'bg-rose-500',     users: [
        { id: 10, name: 'System Admin',   email: 'admin@docsigner.corp',  pass: 'admin999', dept: 'Operations' },
    ]},
];

const ROLE_META = {
    Author:   { color: 'violet', label: 'Doc Creator',  icon: '✏️',  desc: 'Create & submit documents for review' },
    Reviewer: { color: 'amber',  label: 'Reviewer',     icon: '🔍',  desc: 'Review, annotate, and forward documents' },
    Approver: { color: 'emerald',label: 'Approver',     icon: '✅',  desc: 'Final sign-off with biometric seal' },
    Admin:    { color: 'rose',   label: 'Admin',        icon: '⚙️',  desc: 'Full system access and user management' },
};

const LoginView = ({ onLogin }) => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    // Quick-fill a demo card
    const fillDemo = (user) => {
        setEmail(user.email);
        setPassword(user.pass);
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Find matching demo user
        let matched = null;
        for (const group of DEMO_USERS) {
            const found = group.users.find(u => u.email === email && u.pass === password);
            if (found) { matched = { ...found, role: group.role }; break; }
        }

        if (!matched) {
            setError('Invalid credentials. Use the quick-login cards below.');
            setLoading(false);
            return;
        }

        // Fetch real user from backend to confirm & get DB id
        try {
            const res = await fetch(`/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.user_id) {
                onLogin({ ...data, localRole: matched.role });
            } else {
                // Fallback to demo (offline mode)
                onLogin({ user_id: matched.id, full_name: matched.name, role: matched.role, dept: matched.dept, email: matched.email });
            }
        } catch {
            // Backend may be unavailable in dev — use local demo data
            onLogin({ user_id: matched.id, full_name: matched.name, role: matched.role, dept: matched.dept, email: matched.email });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1D76D2]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#009688]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-10 z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">

                {/* Left Side: Login Form Card */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h1 className="text-white font-extrabold text-lg tracking-tight">DOC SIGNER</h1>
                                <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Secure Gateway</p>
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-black text-white tracking-tight mb-1">Welcome back</h2>
                        <p className="text-slate-400 text-sm mb-6 font-medium">Verify credentials to access workspace.</p>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        placeholder="name@docsigner.corp"
                                        className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Security Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:opacity-50 mt-6"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><LogIn size={16} /> Authenticate Access</>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="pt-6 border-t border-slate-800 mt-8">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                            <ShieldCheck size={14} className="text-primary" />
                            SOC 2 Type II Certified
                        </div>
                    </div>
                </div>

                {/* Right Side: Quick Login Cards */}
                <div className="flex flex-col justify-center space-y-5">
                    <div>
                        <h3 className="text-white font-extrabold text-xl tracking-tight">Entitled Governance Roles</h3>
                        <p className="text-slate-400 text-sm mt-1 font-medium">Select a simulation card below to quick-fill credentials and test RBAC permissions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DEMO_USERS.map(group => {
                            const meta = ROLE_META[group.role] || ROLE_META['Author'];
                            return (
                                <div key={group.role} className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-900">
                                        <span className="text-base">{meta.icon}</span>
                                        <div>
                                            <div className="text-white font-bold text-sm leading-none">{meta.label}</div>
                                            <div className="text-[10px] text-slate-500 font-medium mt-1 leading-none">{meta.desc}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {group.users.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => fillDemo(user)}
                                                className={`group text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 rounded-xl p-3 transition-all active:scale-[0.98] ${email === user.email ? 'border-primary bg-primary/5 hover:bg-primary/5' : ''}`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                                                </div>
                                                <div className="text-white font-bold text-xs truncate">{user.name}</div>
                                                <div className="text-slate-500 text-[10px] mt-0.5">{user.dept} · Pass: <span className="font-mono text-primary/70">{user.pass}</span></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
