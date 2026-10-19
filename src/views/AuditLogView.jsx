import React, { useState, useEffect } from 'react';
import { History, Search, Download, ShieldCheck, Mail, FileText, CheckCircle2, Clock } from 'lucide-react';
import { docService } from '../services/docService';

const AuditLogView = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAudit = async () => {
        setLoading(true);
        try {
            const docs = await docService.getDocuments();
            const allLogs = [];
            for (const doc of docs) {
                const detail = await docService.getDocumentById(doc.doc_id);
                if (detail.audit_log) {
                    detail.audit_log.forEach(log => {
                        allLogs.push({
                            ...log,
                            docTitle: detail.title,
                            docId: detail.doc_id,
                            docVersion: detail.version
                        });
                    });
                }
            }
            const sorted = allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setLogs(sorted);
            setFilteredLogs(sorted);
        } catch (err) {
            console.error("Audit log fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudit();
    }, []);

    // Handle search filtering
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredLogs(logs);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = logs.filter(log => 
                log.docTitle.toLowerCase().includes(term) ||
                log.docId.toString().includes(term) ||
                (log.performer_name && log.performer_name.toLowerCase().includes(term)) ||
                log.action_taken.toLowerCase().includes(term) ||
                (log.comments && log.comments.toLowerCase().includes(term))
            );
            setFilteredLogs(filtered);
        }
    }, [searchTerm, logs]);

    const handleExport = () => {
        // Export CSV logic simulation
        let csvContent = "data:text/csv;charset=utf-8,Timestamp,Document ID,Document Title,Performer,Action,Duration,Comments\n";
        filteredLogs.forEach(l => {
            const duration = l.duration_in_stage ? JSON.stringify(l.duration_in_stage).replace(/"/g, '') : '-';
            csvContent += `${new Date(l.created_at).toLocaleString()},${l.docId},"${l.docTitle}","${l.performer_name || 'System'}",${l.action_taken},${duration},"${l.comments || '-'}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `doc_signer_system_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving System Ledger...</span>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
            
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200/80 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none shrink-0">
                <div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                        <span>Ledger</span>
                        <span>/</span>
                        <span className="text-slate-600">Audit Audit History</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight flex items-center gap-2">
                        System Audit Ledger
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 bg-emerald/5 text-emerald px-2 py-0.5 rounded text-[9px] font-black border border-emerald/10 uppercase tracking-widest">
                            <ShieldCheck size={12} className="fill-emerald/20" /> SOC 2 AUDITED
                        </span>
                        <p className="text-xs text-slate-500 font-medium">Immutable cryptographically-sealed transaction ledger of all workflow state actions.</p>
                    </div>
                </div>
                <div>
                    <button 
                        onClick={handleExport}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <Download size={14} /> Export CSV Ledger
                    </button>
                </div>
            </header>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Search Bar */}
                <div className="flex items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm select-none">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" size={14} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter audit logs by title, user, or status..."
                            className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-medium bg-slate-50/50 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Audit table */}
                {filteredLogs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-100 p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
                        <History size={48} className="text-slate-300 opacity-60 animate-pulse" />
                        <div>
                            <h3 className="font-bold text-slate-700 text-sm">No transaction records</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">There are no records Matching the filter terms inside the system ledger.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden select-none flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                                        <th className="px-6 py-4">Verification Time</th>
                                        <th className="px-6 py-4">Document Details</th>
                                        <th className="px-6 py-4">Performer Identity</th>
                                        <th className="px-6 py-4">Action Taken</th>
                                        <th className="px-6 py-4">Duration in Stage</th>
                                        <th className="px-6 py-4">Ledger Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-50/25 transition-all">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[10px] leading-none">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                    <FileText size={12} className="text-primary/70" />
                                                    <span>{log.docTitle}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-mono">
                                                    <span className="bg-slate-100 text-slate-650 px-1 py-0.2 rounded font-bold">v{log.docVersion}.0</span>
                                                    <span>ID: {log.docId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6.5 h-6.5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-650 shadow-inner shrink-0">
                                                        {log.performer_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="font-bold text-slate-750 text-xs">{log.performer_name || 'System Automator'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                                    log.action_taken === 'APPROVED' ? 'bg-emerald/5 border-emerald/20 text-emerald' :
                                                    log.action_taken === 'RETURN' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                    'bg-blue-50 border-blue-100 text-primary'
                                                }`}>
                                                    {log.action_taken}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-[10px] leading-none">
                                                {log.duration_in_stage ? (
                                                    Object.keys(log.duration_in_stage).length > 0
                                                        ? Object.entries(log.duration_in_stage).map(([unit, val]) => `${val}${unit[0]}`).join(' ')
                                                        : '0s'
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate font-medium">
                                                {log.comments || '-'}
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

export default AuditLogView;
