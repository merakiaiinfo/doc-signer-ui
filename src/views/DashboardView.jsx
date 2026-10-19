import React, { useState, useEffect } from 'react';
import {
    PlusCircle, AlertCircle, CheckCircle2, Zap, FileText, AlertTriangle,
    TrendingUp, BarChart2, Clock, Search, Bell, Mail, RefreshCw
} from 'lucide-react';
import { KpiCard } from '../components/CommonUI';
import { docService } from '../services/docService';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import UploadModal from '../components/UploadModal';

const DashboardView = () => {
    const [analytics, setAnalytics] = useState(null);
    const [bottlenecks, setBottlenecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('ds_current_user') || '{}');
    const canCreate = ['Author', 'Admin'].includes(currentUser?.role);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [a, b] = await Promise.all([
                docService.getAnalytics(),
                docService.getBottlenecks()
            ]);
            setAnalytics(a);
            setBottlenecks(b);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleNudge = async (docId) => {
        try {
            // Simulated nudge API action
            alert(`Simulation: SLA Nudge notification dispatched to the current holder of Document #${docId}`);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && !analytics) return (
        <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synthesizing Analytics...</span>
            </div>
        </div>
    );

    const summary = analytics?.summary_metrics;

    // Formatting Pie Chart values
    const pieData = [
        { name: 'Formatting', value: 55, color: '#1D76D2' },
        { name: 'Missing Info', value: 25, color: '#D32F2F' },
        { name: 'Legal Conflict', value: 20, color: '#009688' }
    ];

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
            <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onRefresh={fetchData} />
            
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200/80 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Weekly Executive Summary</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time workflow turnaround metrics and SLA bottlenecks</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                        title="Refresh data"
                    >
                        <RefreshCw size={16} />
                    </button>
                    {canCreate && (
                        <button 
                            onClick={() => setIsUploadOpen(true)} 
                            className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            <PlusCircle size={18} /> New Document Intake
                        </button>
                    )}
                </div>
            </header>

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none">
                
                {/* KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KpiCard
                        title="Total Completed"
                        value={summary?.total_completed || 0}
                        icon={CheckCircle2}
                        colorClass="border-l-[#009688]"
                        badge={{ text: "+10% MoM", className: "bg-emerald/5 border-emerald/20 text-[#009688]" }}
                    />
                    <KpiCard
                        title="Avg. Cycle Time"
                        value={`${summary?.avg_cycle_time || 0} Days`}
                        icon={Zap}
                        colorClass="border-l-[#1D76D2]"
                        badge={{ text: "On Target", className: "bg-blue-50 border-blue-100 text-[#1D76D2]" }}
                    />
                    <KpiCard
                        title="Active Documents"
                        value={summary?.total_active || 0}
                        icon={FileText}
                        colorClass="border-l-[#FF9800]"
                        badge={{ text: "In Process", className: "bg-amber-50 border-amber-100 text-amber-700" }}
                    />
                    <KpiCard
                        title="Overdue (>72h)"
                        value={summary?.total_overdue || 0}
                        icon={AlertTriangle}
                        colorClass="border-l-[#D32F2F]"
                        badge={{ text: "Critical SLA", className: "bg-red-50 border-red-100 text-[#D32F2F]" }}
                    />
                </div>

                {/* Charts Segment */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    
                    {/* Signing Volume Trends (Area Chart - 3 cols) */}
                    <div className="xl:col-span-3 bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp size={18} className="text-primary" />
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Signing Volume Trends</h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics?.monthly_trends}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1D76D2" stopOpacity={0.12} />
                                            <stop offset="95%" stopColor="#1D76D2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #F1F5F9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontSize: 11 }} />
                                    <Area type="monotone" name="Inflow Volume" dataKey="volume" stroke="#1D76D2" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={3} />
                                    <Area type="monotone" name="Completed Gate" dataKey="completed" stroke="#009688" fillOpacity={0} strokeWidth={2.5} strokeDasharray="6 6" />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 500, pt: 10 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Chart (Rejection reasons - 2 cols) */}
                    <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart2 size={18} className="text-ruby" />
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rejection Frequency Reasons</h3>
                        </div>
                        <div className="h-56 w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none flex flex-col">
                                <span className="text-2xl font-black text-slate-800 leading-none">15%</span>
                                <span className="text-[9px] uppercase font-bold text-slate-400 mt-1 tracking-wider">Total Rate</span>
                            </div>
                        </div>
                        {/* Custom Legend */}
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-4 mt-2">
                            {pieData.map(entry => (
                                <div key={entry.name} className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[10px] text-slate-500 font-semibold">{entry.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 mt-1">{entry.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Segment */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    
                    {/* Turnaround Time hours (Bar Chart - 2 cols) */}
                    <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between min-h-[340px]">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock size={18} className="text-primary" />
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg. Turnaround Time (Hours)</h3>
                        </div>
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics?.departmental_performance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="dept_name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                                    <YAxis hide />
                                    <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 6, border: 'none', boxShadow: '0 5px 10px rgba(0,0,0,0.05)' }} />
                                    <Bar dataKey="avg_hours_to_sign" fill="#1D76D2" radius={[4, 4, 0, 0]} barSize={32}>
                                        {analytics?.departmental_performance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.avg_hours_to_sign > 48 ? '#D32F2F' : '#1D76D2'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottlenecks List (Table - 3 cols) */}
                    <div className="xl:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[340px]">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle size={15} className="text-ruby" /> Critical SLA Bottlenecks ( {'>'} 72h )
                            </h3>
                            <span className="text-[9px] font-black text-ruby bg-ruby/15 border border-ruby/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Needs Review
                            </span>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                                        <th className="px-6 py-3">Pending Document</th>
                                        <th className="px-6 py-3">Current Holder</th>
                                        <th className="px-6 py-3 text-right">Age</th>
                                        <th className="px-6 py-3 text-right">SLA Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {bottlenecks.map(b => (
                                        <tr key={b.doc_id} className="hover:bg-slate-50/20 transition-all group">
                                            <td className="px-6 py-3.5">
                                                <div className="font-semibold text-slate-800 text-xs truncate max-w-[160px]">{b.title}</div>
                                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">{b.doc_id}</div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] shadow-inner">{b.current_holder.charAt(0)}</div>
                                                    <span>{b.current_holder}</span>
                                                </div>
                                                <div className="text-[9px] text-slate-450 font-semibold uppercase tracking-tight mt-0.5">{b.department}</div>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <span className="text-ruby font-bold bg-ruby/5 px-2 py-0.5 rounded border border-ruby/10 tabular-nums text-[10px]">
                                                    {b.days_pending}d {b.hours_pending}h
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <button 
                                                    onClick={() => handleNudge(b.doc_id)}
                                                    className="text-primary hover:text-primary/80 font-bold text-[10px] uppercase tracking-wider hover:underline"
                                                >
                                                    Nudge User
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
