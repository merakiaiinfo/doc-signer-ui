import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FileText, Settings, History, User, LogOut, Shield, ChevronDown, Edit3
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import DocumentsListView from './views/DocumentsListView';
import DocumentReviewView from './views/DocumentReviewView';
import AuditLogView from './views/AuditLogView';
import AdminManagementView from './views/AdminManagementView';

function cn(...inputs) { return twMerge(clsx(inputs)); }

// Role-permission map (mirrors DB)
const ROLE_NAV = {
    Author:   ['documents'],
    Reviewer: ['documents'],
    Approver: ['documents', 'dashboard'],
    Admin:    ['dashboard', 'documents', 'audit-log', 'admin'],
};

const ROLE_BADGE = {
    Author:   { color: 'bg-violet-100 text-violet-700', label: 'Creator' },
    Reviewer: { color: 'bg-amber-100  text-amber-700',  label: 'Reviewer' },
    Approver: { color: 'bg-emerald-100 text-emerald-700', label: 'Approver' },
    Admin:    { color: 'bg-rose-100   text-rose-700',   label: 'Admin' },
};

const ALL_NAV = [
    { id: 'dashboard',   title: 'Executive Summary',  icon: LayoutDashboard, path: '/'         },
    { id: 'documents',   title: 'My Documents',       icon: FileText,        path: '/documents' },
    { id: 'audit-log',   title: 'Audit Log',          icon: History,         path: '/audit-log' },
    { id: 'admin',       title: 'System Management',  icon: Settings,        path: '/admin'     },
];

const Sidebar = ({ currentUser, onLogout }) => {
    const location = useLocation();
    const allowed = ROLE_NAV[currentUser?.role] || [];
    const navItems = ALL_NAV.filter(n => allowed.includes(n.id));
    const badge = ROLE_BADGE[currentUser?.role] || ROLE_BADGE.Author;

    // Hide sidebar on review screen
    if (location.pathname.match(/^\/documents\/\d+$/)) return null;

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col z-20 shrink-0 select-none">
            <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                    <Shield size={18} />
                </div>
                <div>
                    <h1 className="text-base font-bold text-slate-800 tracking-tight uppercase leading-none">Doc Signer</h1>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mt-1">{badge.label} Access</span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                                isActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <item.icon size={18} className={cn(isActive ? "text-primary" : "text-slate-400")} />
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User identity card */}
            <div className="p-4 border-t border-slate-100 space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-inner">
                        {currentUser?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{currentUser?.full_name}</div>
                        <div className="text-[9px] text-slate-400 font-medium truncate uppercase tracking-tight mt-0.5">{currentUser?.dept}</div>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all text-xs font-bold border border-slate-200/60"
                >
                    <LogOut size={12} /> Sign Out
                </button>
            </div>
        </aside>
    );
};

const App = () => {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('ds_current_user');
        return saved ? JSON.parse(saved) : null;
    });

    const handleLogin = (user) => {
        localStorage.setItem('ds_current_user', JSON.stringify(user));
        localStorage.setItem('sim_user_id', user.user_id.toString());
        setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('ds_current_user');
        localStorage.removeItem('sim_user_id');
        setCurrentUser(null);
    };

    if (!currentUser) {
        return <LoginView onLogin={handleLogin} />;
    }

    return (
        <Router>
            <div className="flex min-h-screen bg-professional-mist">
                <Sidebar currentUser={currentUser} onLogout={handleLogout} />
                <div className="flex-1 flex flex-col min-w-0">
                    <Routes>
                        {/* Role-guarded routes */}
                        {(currentUser.role === 'Admin' || currentUser.role === 'Approver') && (
                            <Route path="/" element={<DashboardView />} />
                        )}
                        {currentUser.role !== 'Admin' && currentUser.role !== 'Approver' && (
                            <Route path="/" element={<DocumentsListView currentUser={currentUser} />} />
                        )}

                        <Route path="/documents" element={<DocumentsListView currentUser={currentUser} />} />
                        <Route path="/documents/:id" element={<DocumentReviewView currentUser={currentUser} />} />

                        {(currentUser.role === 'Admin') && (
                            <>
                                <Route path="/audit-log" element={<AuditLogView />} />
                                <Route path="/admin" element={<AdminManagementView />} />
                            </>
                        )}
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;
