import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronRight, Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../components/CommonUI';
import { docService } from '../services/docService';
import { useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';

const DocumentsListView = ({ currentUser }) => {
    const canCreate = ['Author', 'Admin'].includes(currentUser?.role);
    const [documents, setDocuments] = useState([]);
    const [filteredDocs, setFilteredDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // all, pending, completed, archived
    const navigate = useNavigate();

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const data = await docService.getDocuments();
            const list = Array.isArray(data) ? data : [];
            setDocuments(list);
            setFilteredDocs(list);
        } catch (err) {
            console.error("Failed to fetch documents", err);
            setDocuments([]);
            setFilteredDocs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    // Filter documents based on Search and Tab
    useEffect(() => {
        let docs = [...documents];

        // Apply Tab Filter
        if (activeTab === 'pending') {
            // Pending Action: 
            // - If user is Author: Draft (Stage 1) or returned
            // - If user is Reviewer: Stage 2
            // - If user is Approver: Stage 3
            docs = docs.filter(d => {
                if (currentUser.role === 'Author') return d.current_stage_id === 1 || d.status === 'RETURNED_FOR_FIX';
                if (currentUser.role === 'Reviewer') return d.current_stage_id === 2;
                if (currentUser.role === 'Approver') return d.current_stage_id === 3;
                return d.current_stage_id < 4; // Admin sees all active
            });
        } else if (activeTab === 'completed') {
            docs = docs.filter(d => d.current_stage_id === 4 || d.status === 'CLOSED');
        } else if (activeTab === 'archived') {
            // Simulated archived docs (subset of closed/old docs)
            docs = docs.filter(d => d.status === 'CLOSED');
        }

        // Apply Search Filter
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            docs = docs.filter(d => 
                d.title.toLowerCase().includes(term) || 
                d.doc_id.toString().includes(term) ||
                (d.department && d.department.toLowerCase().includes(term))
            );
        }

        setFilteredDocs(docs);
    }, [documents, searchTerm, activeTab, currentUser]);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
            <UploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRefresh={fetchDocs}
            />

            {/* Header section matching Stitch design */}
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200/80 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Documents Registry</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Manage and track cryptographic compliance transitions</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchDocs}
                        className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                        title="Reload list"
                    >
                        <RefreshCw size={16} />
                    </button>
                    {canCreate && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Upload size={18} /> Upload New Document
                        </button>
                    )}
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Search and Filters row */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm select-none">
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-100 gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
                        {[
                            { id: 'all', label: 'All Documents' },
                            { id: 'pending', label: 'Pending Action' },
                            { id: 'completed', label: 'Completed' },
                            { id: 'archived', label: 'Archived' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 font-bold text-xs border-b-2 transition-all uppercase tracking-wider ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary font-semibold'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter documents by keyword..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50/50 focus:bg-white rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 transition-all text-xs font-medium"
                        />
                    </div>
                </div>

                {/* Document Table (Desktop Layout) */}
                {loading ? (
                    <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        <span className="text-xs font-semibold uppercase tracking-wider">Syncing Ledger...</span>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-100 p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
                        <FileText size={48} className="text-slate-300 opacity-60" />
                        <div>
                            <h3 className="font-bold text-slate-700 text-sm">No documents found</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">There are no artifacts matching the active search criteria or status filter.</p>
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden select-none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="px-6 py-4">Document Details</th>
                                        <th className="px-6 py-4">Workflow Stage</th>
                                        <th className="px-6 py-4">Registry Status</th>
                                        <th className="px-6 py-4">Department & Holder</th>
                                        <th className="px-6 py-4 text-right">Action Gate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDocs.map((doc) => {
                                        const stageLabels = ['Prepare', 'Review', 'Approval', 'Sealed'];
                                        const currentStageLabel = stageLabels[doc.current_stage_id - 1] || 'Draft';
                                        
                                        // Dynamic action text
                                        let actionText = 'View Details';
                                        if (doc.status === 'DRAFT') actionText = 'Edit Draft';
                                        else if (doc.status === 'CLOSED') actionText = 'Download PDF';
                                        else if (doc.current_stage_id === 2 && currentUser.role === 'Reviewer') actionText = 'Sign & Forward';
                                        else if (doc.current_stage_id === 3 && currentUser.role === 'Approver') actionText = 'Approve & Seal';

                                        return (
                                            <tr key={doc.doc_id} className="hover:bg-slate-50/20 transition-all group">
                                                <td className="px-6 py-4.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 text-sm truncate max-w-xs">{doc.title}</div>
                                                            <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-slate-400">
                                                                <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold uppercase">v{doc.version}.0</span>
                                                                <span>ID: {doc.doc_id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4.5">
                                                    <div className="flex flex-col gap-1.5 max-w-[140px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                doc.current_stage_id === 4 ? 'bg-emerald' : 'bg-primary'
                                                            }`} />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">STAGE {doc.current_stage_id}: {currentStageLabel}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${
                                                                    doc.current_stage_id === 4 ? 'bg-emerald' : 'bg-primary'
                                                                }`}
                                                                style={{ width: `${(doc.current_stage_id / 4) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4.5">
                                                    <StatusBadge status={doc.status} />
                                                </td>
                                                <td className="px-6 py-4.5">
                                                    <div className="text-slate-700 font-semibold text-xs">{doc.department}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] mt-0.5">
                                                        {doc.assigned_reviewer_id || doc.author_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4.5 text-right">
                                                    <button
                                                        onClick={() => navigate(`/documents/${doc.doc_id}`)}
                                                        className="text-primary hover:text-primary/80 font-bold text-xs tracking-tight transition-colors uppercase"
                                                    >
                                                        {actionText}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Mobile Responsive Cards Layout */}
                {!loading && filteredDocs.length > 0 && (
                    <div className="block lg:hidden space-y-4 select-none">
                        {filteredDocs.map((doc) => {
                            const stageLabels = ['Prepare', 'Review', 'Approval', 'Sealed'];
                            const currentStageLabel = stageLabels[doc.current_stage_id - 1] || 'Draft';
                            return (
                                <div 
                                    key={doc.doc_id} 
                                    onClick={() => navigate(`/documents/${doc.doc_id}`)}
                                    className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 hover:border-slate-200 transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{doc.title}</h3>
                                            <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-slate-400">
                                                <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold">v{doc.version}.0</span>
                                                <span>ID: {doc.doc_id}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status={doc.status} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-slate-50 pt-3">
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider">Current Stage</p>
                                            <p className="text-slate-600 font-semibold mt-0.5 uppercase">STAGE {doc.current_stage_id}: {currentStageLabel}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider">Department / Owner</p>
                                            <p className="text-slate-600 font-semibold mt-0.5 truncate max-w-[120px]">{doc.department} / {doc.author_name}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentsListView;
