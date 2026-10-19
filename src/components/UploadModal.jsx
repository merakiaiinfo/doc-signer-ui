import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, ArrowRight, FileText, UserPlus, Shield, UserCheck } from 'lucide-react';
import { docService } from '../services/docService';
import { useNavigate } from 'react-router-dom';

const UploadModal = ({ isOpen, onClose, onRefresh }) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [reviewers, setReviewers] = useState([]);
    const [approvers, setApprovers] = useState([]);
    const [sourceType, setSourceType] = useState('FILE'); // FILE or URL
    const [googleUrl, setGoogleUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (isOpen) {
                try {
                    const data = await docService.getSigners();
                    const list = Array.isArray(data) ? data : [];
                    setUsers(list);
                    if (list.length > 0) {
                        const defaultReviewer = list.find(u => u.role === 'Reviewer');
                        const defaultApprover = list.find(u => u.role === 'Approver');
                        if (defaultReviewer) setReviewers([defaultReviewer.user_id.toString()]);
                        if (defaultApprover) setApprovers([defaultApprover.user_id.toString()]);
                    }
                } catch (e) { 
                    console.error(e); 
                    setUsers([]); 
                }
            }
        };
        fetchUsers();
    }, [isOpen]);

    const handleToggleReviewer = (userId) => {
        const idStr = userId.toString();
        setReviewers(prev => 
            prev.includes(idStr) 
                ? prev.filter(id => id !== idStr) 
                : [...prev, idStr]
        );
    };

    const handleToggleApprover = (userId) => {
        const idStr = userId.toString();
        setApprovers(prev => 
            prev.includes(idStr) 
                ? prev.filter(id => id !== idStr) 
                : [...prev, idStr]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (sourceType === 'FILE' && !file) return alert("Please select a local document");
        if (sourceType === 'URL' && !googleUrl) return alert("Please enter the Google Doc URL");
        if (reviewers.length === 0) return alert("Please select at least one reviewer");
        if (approvers.length === 0) return alert("Please select at least one approver");

        setLoading(true);
        try {
            const authorId = localStorage.getItem('sim_user_id') || '1';
            const result = await docService.createDocument({
                title,
                author_id: authorId,
                reviewers: reviewers,
                approvers: approvers,
                file: sourceType === 'FILE' ? file : null,
                google_doc_url: sourceType === 'URL' ? googleUrl : null
            });
            
            if (result.doc_id) {
                setSuccess(true);
                setTimeout(() => {
                    onRefresh();
                    onClose();
                    setSuccess(false);
                    setTitle('');
                    setFile(null);
                    setGoogleUrl('');
                    navigate(`/documents/${result.doc_id}`);
                }, 1200);
            } else {
                throw new Error(result.error || "Failed to get document ID");
            }
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                        <Upload size={16} className="text-primary" /> New Document Intake
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors">
                        <X size={16} className="text-slate-400" />
                    </button>
                </div>

                {success ? (
                    <div className="p-12 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-14 h-14 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={28} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-850">Intake Initialized</h4>
                        <p className="text-xs text-slate-400 mt-1.5 font-medium">Workflow ledger has been dynamically set up.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        
                        {/* Tab Switcher Segment */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setSourceType('FILE')}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all ${
                                    sourceType === 'FILE' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                Local Document (.docx)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSourceType('URL')}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all ${
                                    sourceType === 'URL' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                Google Doc Link
                            </button>
                        </div>

                        {/* Title input */}
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Document Title</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Master Service Agreement 2026"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary/50 focus:outline-none transition-all text-xs font-medium text-slate-700"
                            />
                        </div>

                        {/* Drop Zone / Url input */}
                        {sourceType === 'FILE' ? (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Source Document</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative cursor-pointer group">
                                    <input
                                        required
                                        type="file"
                                        accept=".docx"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <Upload size={24} className="text-slate-400 group-hover:text-primary transition-colors mb-2" />
                                    <span className="text-xs font-bold text-slate-700">Choose .docx file</span>
                                    <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Max limit 25MB</span>
                                </div>
                                {file && (
                                    <p className="mt-2 text-[10px] text-emerald font-bold flex items-center gap-1">
                                        <FileText size={12} /> ✓ {file.name}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Google Doc URL</label>
                                <input
                                    required
                                    type="url"
                                    value={googleUrl}
                                    onChange={(e) => setGoogleUrl(e.target.value)}
                                    placeholder="https://docs.google.com/document/d/..."
                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50/20 rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary/50 focus:outline-none transition-all text-xs font-medium text-slate-700"
                                />
                            </div>
                        )}

                        {/* Custom Signers Select Panels */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Reviewers List */}
                            <div className="flex flex-col">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assign Reviewers</label>
                                <div className="h-28 overflow-y-auto border border-slate-200 rounded-lg p-2.5 space-y-1 bg-slate-50/30">
                                    {users.filter(u => u.role === 'Reviewer').map(u => {
                                        const isSelected = reviewers.includes(u.user_id.toString());
                                        return (
                                            <button
                                                key={u.user_id}
                                                type="button"
                                                onClick={() => handleToggleReviewer(u.user_id)}
                                                className={`w-full flex items-center justify-between p-1.5 rounded transition-all text-left text-xs ${
                                                    isSelected 
                                                        ? 'bg-primary/5 border border-primary/20 text-primary font-bold' 
                                                        : 'hover:bg-slate-100 border border-transparent text-slate-600'
                                                }`}
                                            >
                                                <span>{u.full_name} ({u.department})</span>
                                                {isSelected && <UserCheck size={12} className="text-primary" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Approvers List */}
                            <div className="flex flex-col">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assign Approvers</label>
                                <div className="h-28 overflow-y-auto border border-slate-200 rounded-lg p-2.5 space-y-1 bg-slate-50/30">
                                    {users.filter(u => u.role === 'Approver').map(u => {
                                        const isSelected = approvers.includes(u.user_id.toString());
                                        return (
                                            <button
                                                key={u.user_id}
                                                type="button"
                                                onClick={() => handleToggleApprover(u.user_id)}
                                                className={`w-full flex items-center justify-between p-1.5 rounded transition-all text-left text-xs ${
                                                    isSelected 
                                                        ? 'bg-primary/5 border border-primary/20 text-primary font-bold' 
                                                        : 'hover:bg-slate-100 border border-transparent text-slate-600'
                                                }`}
                                            >
                                                <span>{u.full_name}</span>
                                                {isSelected && <UserCheck size={12} className="text-primary" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full h-11 uppercase font-bold text-xs tracking-wider transition-all hover:scale-[1.01] active:scale-95 shadow-md shadow-primary/10 disabled:opacity-50"
                            >
                                {loading ? 'Processing Document...' : 'Submit to Workflow Ledger'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UploadModal;
