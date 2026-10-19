import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, MessageSquare, Download, Hash, ShieldCheck, FileText, MousePointer2, AlertCircle, Eye, History, HelpCircle } from 'lucide-react';
import { StageProgressBar, StatusBadge, cn } from '../components/CommonUI';
import { docService } from '../services/docService';
import SignaturePad from '../components/SignaturePad';

const DocumentReviewView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [currentSignature, setCurrentSignature] = useState(null);
    const [signers, setSigners] = useState([]);
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [activeSigner, setActiveSigner] = useState(null);
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
    const [showTrail, setShowTrail] = useState(false);
    const [showOriginalPreview, setShowOriginalPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [hideSignatureManifest, setHideSignatureManifest] = useState(false);

    const currentUserId = localStorage.getItem('sim_user_id');
    const currentUserRole = localStorage.getItem('sim_user_role');
    const isAuthor = doc && parseInt(currentUserId) === doc.author_id;
    const isAdmin = currentUserRole === 'Admin';
    
    // Determine current user's role in this document (if any)
    const currentUserSigner = doc && signers.find(s => parseInt(s.user_id) === parseInt(currentUserId));
    const currentUserSignerRole = currentUserSigner?.role_name || currentUserSigner?.role;
    
    // Check if current user has already signed at this stage
    const hasCurrentUserSigned = currentUserSigner?.status === 'SIGNED';
    
    // Count total approvers at current stage (for multi-approver logic)
    const approversAtCurrentStage = doc ? signers.filter(s => s.role === 'APPROVER' || s.role_name === 'Approver') : [];
    const signedApproversCount = approversAtCurrentStage.filter(s => s.status === 'SIGNED').length;
    const allApproversHaveSigned = signedApproversCount === approversAtCurrentStage.length;
    
    // Check if user is a stakeholder (signer) in this document
    const isUserAStakeholder = !!currentUserSigner || isAdmin;
    
    // Determine if user can take action in current stage
    const canActOnCurrentStage = isSetupMode || 
        (doc?.current_stage_id === 2 && (currentUserSignerRole === 'Reviewer' || isAdmin)) ||
        (doc?.current_stage_id === 3 && (currentUserSignerRole === 'Approver' || isAdmin));
    
    // Check if user's role is appropriate for current stage
    const isRoleAppropriateForStage = (isAuthor && doc?.current_stage_id === 1) ||
        (currentUserSignerRole === 'Reviewer' && doc?.current_stage_id === 2) ||
        (currentUserSignerRole === 'Approver' && doc?.current_stage_id === 3);
    
    // Show action panel only if user's role is appropriate for current stage
    const showActionPanel = canActOnCurrentStage && isRoleAppropriateForStage;
    
    const canReviewOrSign = !isAuthor || doc?.current_stage_id === 1;
    const showSignatureManifest = !hideSignatureManifest && (isSetupMode || doc?.current_stage_id > 1);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const fetchDoc = async () => {
        try {
            const data = await docService.getDocumentById(id);
            setDoc(data);
            setSigners(data.signers || []);
            if (data.current_stage_id === 1) {
                setIsSetupMode(true);
            }
        } catch (err) {
            console.error("Failed to fetch document:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoc();
    }, [id]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                setHideSignatureManifest(config.hideSignatureManifest);
            } catch (err) {
                console.error("Failed to fetch config:", err);
            }
        };
        fetchConfig();
    }, []);

    const handleTransition = async (action) => {
        if (action === 'APPROVE') {
            setIsSigning(true);
            return;
        }
        if (action === 'UNAPPROVE') {
            confirmTransition(action, false);
            return;
        }
        confirmTransition(action, false);
    };

    const onSignatureComplete = async (sigData) => {
        setCurrentSignature(sigData);
        setIsSigning(false);

        if (doc.current_stage_id === 3) {
            setIsVerifying(true);
            // Simulate Biometric Scanning / Compliance sealing
            setTimeout(() => {
                confirmTransition('APPROVE', true, sigData);
            }, 1800);
        } else {
            confirmTransition('APPROVE', false, sigData);
        }
    };

    const confirmTransition = async (action, biometricVerified, sigData) => {
        const data = {
            action,
            performer_id: localStorage.getItem('sim_user_id') || (doc.current_stage_id === 1 ? doc.author_id : 1),
            notes: comments,
            metadata: {
                rejection_reason_code: returnReason,
                biometric_verified: biometricVerified,
                signature_image: sigData || currentSignature
            }
        };

        try {
            await docService.transitionDocument(id, data);
            setIsVerifying(false);
            navigate('/documents');
        } catch (err) {
            alert("Transition failed: " + err.message);
            setIsVerifying(false);
        }
    };

    const handleSavePositions = async () => {
        try {
            await fetch(`/api/documents/${id}/signers`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': localStorage.getItem('sim_user_id') || '1'
                },
                body: JSON.stringify({ signers })
            });
            alert("Signer positions saved and manifest updated!");
        } catch (err) {
            console.error("Failed to save positions:", err);
        }
    };

    const handleDragStart = (signer) => {
        setActiveSigner(signer);
    };

    const handleSnapDrop = (e, targetUserId, pageNumber = 2) => {
        e.preventDefault();
        e.stopPropagation();
        if (!activeSigner || activeSigner.user_id !== targetUserId) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setSigners(prev => prev.map(s => 
            s.user_id === activeSigner.user_id 
            ? { ...s, x_pos: x, y_pos: y, page_number: pageNumber }
            : s
        ));
        setActiveSigner(null);
    };

    const handleDropOnDocument = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!activeSigner) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setSigners(prev => prev.map(s => 
            s.user_id === activeSigner.user_id 
            ? { ...s, x_pos: x, y_pos: y, page_number: 1 }
            : s
        ));
        setActiveSigner(null);
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Document...</span>
            </div>
        </div>
    );

    if (!doc) return <div className="p-8 text-center text-ruby font-bold">Document not found.</div>;

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100">
            
            {/* Design Shell Header */}
            <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-sm z-20 shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-150">
                        <ChevronLeft size={16} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <FileText size={16} className="text-primary" /> {doc.title}
                        </h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono uppercase">v{doc.version}.0</span>
                            <StatusBadge status={doc.status} />
                        </div>
                    </div>
                </div>

                {/* Stage Indicator in Header */}
                <div className="hidden md:flex items-center justify-center flex-1 max-w-sm mx-10">
                    <StageProgressBar currentStage={doc.current_stage_id} />
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => docService.downloadDocument(doc.doc_id)} 
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
                        title="Download Source Document"
                    >
                        <Download size={14} /> Download Copy
                    </button>
                    <button
                        onClick={async () => {
                            if (previewUrl) {
                                setPreviewUrl(null);
                                setShowOriginalPreview(false);
                                return;
                            }
                            try {
                                const url = await docService.getDocumentPreview(doc.doc_id);
                                setPreviewUrl(url);
                                setShowOriginalPreview(true);
                            } catch (err) {
                                alert('Unable to preview document: ' + err.message);
                            }
                        }}
                        className={cn(
                            "px-3 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm",
                            showOriginalPreview 
                                ? "bg-primary/5 border-primary text-primary" 
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Eye size={14} /> {showOriginalPreview ? 'Hide Original' : 'Preview Original'}
                    </button>
                    <button 
                        onClick={() => setShowTrail(!showTrail)}
                        className={cn(
                            "px-3 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm",
                            showTrail 
                                ? "bg-primary text-white border-primary" 
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <History size={14} /> View Audit Trail
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Left Panel: Stakeholder Library (Setup Mode Only) */}
                {isSetupMode && (
                    <div 
                        className={cn(
                            "bg-white border-r border-slate-200 flex flex-col shadow-sm z-30 transition-all duration-300 relative",
                            leftPanelCollapsed ? "w-12 px-1 py-4" : "w-72 p-5"
                        )}
                    >
                        <button 
                            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                            className="absolute -right-3 top-5 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md z-40 hover:bg-slate-50 transition-colors"
                        >
                            <ChevronLeft size={12} className={cn("transition-transform duration-300 text-slate-500", leftPanelCollapsed && "rotate-180")} />
                        </button>

                        {!leftPanelCollapsed ? (
                            <div className="flex flex-col h-full animate-in fade-in duration-300">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Workflow Stakeholders</h3>
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                                    {signers.map(s => (
                                        <div 
                                            key={s.user_id}
                                            draggable
                                            onDragStart={() => handleDragStart(s)}
                                            className={cn(
                                                "p-3 rounded-lg border flex items-center gap-3 cursor-grab active:cursor-grabbing select-none transition-all group hover:border-primary hover:shadow-md",
                                                s.x_pos > 0 ? "bg-emerald/5 border-emerald/20 text-emerald" : "bg-white border-slate-100"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs group-hover:bg-primary group-hover:text-white transition-all shadow-inner shrink-0">
                                                {s.full_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-800 truncate leading-none">{s.full_name}</div>
                                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">{s.role_name || s.role}</div>
                                            </div>
                                            {s.x_pos > 0 && (
                                                <div className="w-4 h-4 rounded-full bg-emerald text-white flex items-center justify-center animate-in zoom-in duration-200">
                                                    <CheckCircle2 size={10} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mt-4">
                                    <div className="flex items-start gap-2">
                                        <MousePointer2 size={14} className="text-primary mt-0.5 shrink-0" />
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            <strong className="text-primary block font-bold">DRAG SIGNATURE PLACEMENT</strong>
                                            Pick a stakeholder card above and drag it onto the document canvas to specify where they must sign.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 mt-6 animate-in fade-in duration-300">
                                {signers.map(s => (
                                    <div 
                                        key={s.user_id}
                                        draggable
                                        onDragStart={() => handleDragStart(s)}
                                        className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all cursor-grab active:cursor-grabbing shadow-sm",
                                            s.x_pos > 0 ? "bg-emerald text-white border-emerald" : "bg-slate-50 border-slate-200 text-slate-600"
                                        )}
                                        title={`${s.full_name} (${s.role_name || s.role})`}
                                    >
                                        {s.full_name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Center Panel: Interactive Document Canvas */}
                <div 
                    className="flex-1 overflow-y-auto p-8 relative scroll-smooth flex flex-col items-center gap-8 bg-[#F1F5F9]"
                    onDragOver={(e) => e.preventDefault()}
                >
                    {/* Visual warning if no signature points set */}
                    {isSetupMode && signers.some(s => s.x_pos === 0) && (
                        <div className="w-full max-w-4xl bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-800 animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle size={16} className="text-amber-500 shrink-0" />
                            <span className="text-xs font-semibold">Placements Pending: Drag and drop all stakeholder signatures onto the pages to initialize the document workflow.</span>
                        </div>
                    )}

                    {/* Page 1: Main Document */}
                    <div className="bg-white shadow-xl min-h-[960px] w-full max-w-4xl border border-slate-200/60 relative p-16 md:p-20 shrink-0 flex flex-col select-none rounded-lg">
                        <div className="absolute -left-12 top-0 text-[9px] font-black text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded shadow-sm">PAGE 1</div>
                        
                        {/* Interactive Watermark */}
                        {doc.current_stage_id < 4 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none overflow-hidden">
                                <span className="text-7xl font-black rotate-45 uppercase tracking-[0.2em]">CONFIDENTIAL DRAFT</span>
                            </div>
                        )}

                        <div className="flex-1 flex flex-col font-serif">
                            {/* Document header markup */}
                            <div className="flex justify-between items-start mb-8 border-b-4 border-slate-800 pb-5">
                                <div className="text-2xl font-black tracking-tight text-slate-800">DOC<span className="text-primary">SIGNER</span> LOGISTICS</div>
                                <div className="text-right">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TRANSACTION REFERENCE</div>
                                    <div className="text-xs font-mono font-bold text-primary">#DS-{doc.doc_id}-{new Date(doc.created_at).getFullYear()}</div>
                                </div>
                            </div>

                            <h2 className="text-xl font-extrabold text-slate-800 border-b border-slate-200 pb-2 mb-6 uppercase tracking-tight">{doc.title}</h2>

                            {/* Main Document Frame */}
                            {doc.storage_provider && doc.storage_provider !== 'NONE' ? (
                                <div className="w-full flex-1 rounded-lg overflow-hidden border border-slate-200 shadow-inner bg-slate-50 flex flex-col min-h-[600px] relative">
                                    <iframe
                                        src={previewUrl || `/api/documents/${doc.doc_id}/preview?userId=${currentUserId}`}
                                        className="w-full flex-1 border-0"
                                        title="Compliance Document Frame"
                                    />
                                    {/* Glass Placement Layer */}
                                    <div
                                        className={cn("absolute inset-0 z-20", (!isSetupMode || !activeSigner) && "pointer-events-none")}
                                        onDragOver={(e) => {
                                            if (isSetupMode) {
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = 'move';
                                            }
                                        }}
                                        onDrop={handleDropOnDocument}
                                    >
                                        {isSetupMode && activeSigner && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-widest pointer-events-none">
                                                Drop reviewer signature card on Page 1
                                            </div>
                                        )}
                                        {signers.map(s => s.x_pos > 0 && s.page_number === 1 && (
                                            <div 
                                                key={s.user_id + '_preview_sig'}
                                                style={{ 
                                                    left: `${s.x_pos}%`, 
                                                    top: `${s.y_pos}%`, 
                                                    width: '160px', 
                                                    height: '60px',
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                                className={cn(
                                                    "absolute flex flex-col items-center justify-center border border-dashed rounded",
                                                    (canActOnCurrentStage && isRoleAppropriateForStage && parseInt(s.user_id) === parseInt(currentUserId) && !s.signature_data && !currentSignature) 
                                                        ? "pointer-events-auto border-primary bg-primary/10 shadow-md cursor-pointer animate-pulse hover:bg-primary/20 hover:scale-105 transition-all" 
                                                        : "pointer-events-none border-slate-300 bg-slate-50/50"
                                                )}
                                                onClick={() => {
                                                    if (canActOnCurrentStage && isRoleAppropriateForStage && parseInt(s.user_id) === parseInt(currentUserId) && !s.signature_data && !currentSignature) {
                                                        setActiveSigner(s);
                                                        setIsSigning(true);
                                                    }
                                                }}
                                            >
                                                {(s.signature_data || (s.user_id === parseInt(currentUserId) && currentSignature)) ? (
                                                    <img 
                                                        src={s.signature_data || currentSignature} 
                                                        className="h-12 mix-blend-multiply transition-all duration-500 animate-in zoom-in" 
                                                        alt={`${s.full_name} Seal`} 
                                                    />
                                                ) : (
                                                    (canActOnCurrentStage && isRoleAppropriateForStage && parseInt(s.user_id) === parseInt(currentUserId)) ? (
                                                        <span className="text-[9px] font-black text-primary tracking-wider uppercase">Click to Sign</span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-slate-400 tracking-wider">[{s.full_name}]</span>
                                                    )
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : doc.google_doc_url ? (
                                <div className="w-full flex-1 rounded-lg overflow-hidden border border-slate-200 shadow-inner flex flex-col min-h-[600px]">
                                    <iframe
                                        src={doc.google_doc_url.replace('/edit','/preview')}
                                        className="w-full flex-1 border-0"
                                        title="Google Workspace Document Preview"
                                        allow="autoplay"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6 text-sm text-slate-700 leading-relaxed text-justify pr-2 flex-1">
                                    <p><strong>1. PROVISIONS OF INTENT:</strong> This transactional record represents the compliance ledger initialized and authorized by the initiating creator <span className="text-primary font-bold">{doc.author_name}</span>. This contract dictates subsequent signers must perform execution within SOC 2 SLA limits.</p>
                                    <p><strong>2. CRYPTOGRAPHIC SAFEGUARDS:</strong> The final record generated on completion of the state workflow will be watermarked and hashed using SHA-512 cryptographic checks, locking version changes.</p>
                                    <p><strong>3. CONSENT OF CONTRACT:</strong> By continuing through the sign-off manifest gates, all stakeholders acknowledge legal consent under ESIGN frameworks.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Page 2: Signature Workflow Manifest */}
                    {showSignatureManifest && (
                        <div className="bg-white shadow-xl min-h-[960px] w-full max-w-4xl border border-slate-200/60 relative p-16 md:p-20 shrink-0 flex flex-col select-none rounded-lg">
                            <div className="absolute -left-12 top-0 text-[9px] font-black text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded shadow-sm">PAGE 2</div>
                            
                            <div className="flex-1 flex flex-col font-serif">
                                <div className="border-b border-slate-800 pb-4 mb-8">
                                    <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Compliance Signature Manifest</h2>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1 tracking-wider uppercase">LEDGER IDENTIFIER: {doc.doc_id}-{doc.version}</p>
                                </div>

                                {/* Manifest Table */}
                                <div className="overflow-hidden border border-slate-150 rounded-lg mb-8 shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                                                <th className="p-3">Governance Role</th>
                                                <th className="p-3">Stakeholder</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3 text-center">Interactive Signature Gate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {signers.map(s => {
                                                const isCurrentSignerUser = parseInt(s.user_id) === parseInt(currentUserId);
                                                const canThisRoleSign = isCurrentSignerUser && s.status !== 'SIGNED' && isRoleAppropriateForStage;

                                                return (
                                                    <tr key={s.user_id} className="hover:bg-slate-50/50 transition-colors h-20">
                                                        <td className="p-3 font-mono text-[10px] text-slate-500 uppercase">{s.role_name || s.role}</td>
                                                        <td className="p-3">
                                                            {isSetupMode ? (
                                                                <div
                                                                    draggable
                                                                    onDragStart={() => handleDragStart(s)}
                                                                    className={cn(
                                                                        "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing select-none transition-all text-xs",
                                                                        s.x_pos > 0
                                                                            ? "bg-emerald/5 border-emerald-200 text-emerald font-bold"
                                                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-primary hover:bg-white"
                                                                    )}
                                                                >
                                                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px]">{s.full_name.charAt(0)}</div>
                                                                    <span>{s.full_name}</span>
                                                                    <MousePointer2 size={10} className="text-slate-400 shrink-0" />
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[9px] shadow-inner">{s.full_name.charAt(0)}</div>
                                                                    <span className="font-bold text-slate-800 text-xs">{s.full_name}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                                s.status === 'SIGNED' ? "bg-emerald/10 text-emerald border-emerald-250" : "bg-amber-50 text-amber-700 border-amber-100"
                                                            )}>
                                                                {s.status}
                                                            </span>
                                                        </td>
                                                        {/* Interactive Placement Zone / Click box */}
                                                        <td
                                                            className={cn(
                                                                "p-3 text-center border-l border-slate-50",
                                                                isSetupMode && s.x_pos === 0 ? "bg-primary/5 animate-pulse" : ""
                                                            )}
                                                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                                            onDrop={(e) => handleSnapDrop(e, s.user_id, 2)}
                                                        >
                                                            {isSetupMode ? (
                                                                <div className={cn(
                                                                    "w-44 h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-all mx-auto border-2 text-xs",
                                                                    s.x_pos > 0
                                                                        ? "bg-emerald/5 border-emerald-300 text-emerald"
                                                                        : "bg-white border-dashed border-slate-300 text-slate-400 hover:border-primary hover:text-primary cursor-pointer"
                                                                )}>
                                                                    {s.x_pos > 0 ? (
                                                                        <div className="flex items-center gap-1"><CheckCircle2 size={14} /><span className="text-[9px] font-bold uppercase">Zone Defined</span></div>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center"><MousePointer2 size={12} /><span className="text-[8px] font-bold uppercase mt-0.5">Drop Name Placement</span></div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div 
                                                                    className={cn(
                                                                        "w-44 h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-all mx-auto border text-xs select-none",
                                                                        s.status === 'SIGNED'
                                                                            ? "bg-emerald/5 border-emerald-200 text-emerald"
                                                                            : (canThisRoleSign
                                                                                ? "bg-primary/5 border-primary text-primary hover:bg-primary hover:text-white cursor-pointer shadow-sm hover:shadow active:scale-95"
                                                                                : "bg-slate-50 border-slate-200 text-slate-400")
                                                                    )}
                                                                    onClick={() => {
                                                                        if (canThisRoleSign) {
                                                                            setActiveSigner(s);
                                                                            setIsSigning(true);
                                                                        }
                                                                    }}
                                                                >
                                                                    {s.status === 'SIGNED' ? (
                                                                        <div className="flex items-center gap-1"><CheckCircle2 size={14} /><span className="text-[9px] font-bold uppercase">Authentic Seal</span></div>
                                                                    ) : canThisRoleSign ? (
                                                                        <div className="flex items-center gap-1"><ShieldCheck size={14} /><span className="text-[9px] font-bold uppercase">Click to Sign</span></div>
                                                                    ) : (
                                                                        <span className="text-[8px] font-bold uppercase tracking-wider">Awaiting Signature</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <p className="text-[10px] text-slate-500 italic mb-10 leading-relaxed border-l-2 border-primary/20 pl-3 py-1 bg-slate-50 rounded-r">
                                    Manifest Seal: This workflow transitions and signature seals comply with ESIGN standards. Sealing represents irrevocable consent of Page 1 compliance requirements.
                                </p>

                                {/* Signature overlays on Page 2 */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {signers.map(s => s.x_pos > 0 && s.page_number === 2 && (
                                        <div 
                                            key={s.user_id + '_real_sig'}
                                            style={{ 
                                                left: `${s.x_pos}%`, 
                                                top: `${s.y_pos}%`, 
                                                width: '160px', 
                                                height: '60px',
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                            className="absolute flex flex-col items-center justify-center pt-2 border border-dashed border-emerald/20 bg-emerald/5 rounded"
                                        >
                                            {(s.signature_data || (s.user_id === parseInt(currentUserId) && currentSignature)) ? (
                                                <img 
                                                    src={s.signature_data || currentSignature} 
                                                    className="h-12 mix-blend-multiply transition-all duration-500 animate-in zoom-in" 
                                                    alt={`${s.full_name} Seal`} 
                                                />
                                            ) : (
                                                <span className="text-[9px] font-bold text-slate-350">[{s.full_name}]</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Interactive Actions & Logs */}
                <div 
                    className={cn(
                        "bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-30 transition-all duration-300 relative select-none",
                        rightPanelCollapsed ? "w-12 px-1 py-4" : "w-96 p-6"
                    )}
                >
                    <button 
                        onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                        className="absolute -left-3 top-5 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md z-40 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronRight size={12} className={cn("transition-transform duration-300 text-slate-500", rightPanelCollapsed && "rotate-180")} />
                    </button>

                    {!rightPanelCollapsed ? (
                        <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
                            
                            {/* If Show Audit Trail is active, render Audit logs timeline */}
                            {showTrail ? (
                                <div className="flex-1 flex flex-col h-full overflow-hidden">
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <History size={14} className="text-primary" /> Document Audit Trail
                                        </h3>
                                        <button onClick={() => setShowTrail(false)} className="text-[10px] text-primary font-bold hover:underline">
                                            Close Log
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar">
                                        {doc.audit_log && doc.audit_log.length > 0 ? (
                                            doc.audit_log.map((log, i) => (
                                                <div key={i} className="flex gap-3 relative group">
                                                    {i < doc.audit_log.length - 1 && (
                                                        <div className="absolute left-[7px] top-[14px] bottom-[-22px] w-[2px] bg-slate-100" />
                                                    )}
                                                    <div className={cn(
                                                        "w-4.5 h-4.5 rounded-full flex items-center justify-center text-white shrink-0 z-10 shadow-sm mt-0.5",
                                                        log.action_taken === 'APPROVED' ? 'bg-emerald text-[8px]' :
                                                        log.action_taken === 'RETURN' ? 'bg-[#FF9800] text-[8px]' : 'bg-primary text-[8px]'
                                                    )}>
                                                        {log.action_taken === 'APPROVED' ? '✓' : '➔'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 leading-none">{log.performer_name || 'System Process'}</p>
                                                        <p className="text-[8px] text-slate-400 uppercase mt-1 tracking-wider">{new Date(log.created_at).toLocaleString()}</p>
                                                        <span className={cn(
                                                            "inline-block px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border mt-1.5",
                                                            log.action_taken === 'APPROVED' ? 'bg-emerald/5 border-emerald/20 text-emerald' :
                                                            log.action_taken === 'RETURN' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                            'bg-blue-50 border-blue-100 text-primary'
                                                        )}>
                                                            {log.action_taken}
                                                        </span>
                                                        {log.comments && (
                                                            <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/80 mt-2 font-medium">
                                                                {log.comments}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 text-xs italic">
                                                No compliance events logged yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col h-full">
                                    {/* Action forms rendering based on permissions */}
                                    {canReviewOrSign ? (
                                        showActionPanel ? (
                                            <div className="flex-1 flex flex-col justify-between h-full">
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                                            {doc.current_stage_id === 2 ? '📋 Reviewer Comments' : '✅ Approval Feedback'}
                                                        </label>
                                                        <textarea
                                                            value={comments}
                                                            onChange={(e) => setComments(e.target.value)}
                                                            placeholder={doc.current_stage_id === 2 ? "Provide review notes, findings, or SLA requests..." : "Provide final approval notes..."}
                                                            className="w-full h-36 p-3 text-xs border border-slate-200 rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary focus:outline-none resize-none transition-all bg-slate-50/20"
                                                        />
                                                    </div>
                                                    {doc.current_stage_id === 2 && (
                                                        <div className="animate-in slide-in-from-top-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reconciliation Reason Code</label>
                                                            <select
                                                                value={returnReason}
                                                                onChange={(e) => setReturnReason(e.target.value)}
                                                                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white font-semibold text-slate-700 shadow-sm"
                                                            >
                                                                <option value="">Select reason code...</option>
                                                                <option value="CONTENT_INACCURATE">Content Inaccurate</option>
                                                                <option value="MISSING_INFORMATION">Missing Information</option>
                                                                <option value="DEPARTMENT_POLICY">Department Policy</option>
                                                                <option value="LEGAL_CONFLICT">Legal Conflict</option>
                                                                <option value="BUDGET_EXCEEDED">Budget Threshold Exceeded</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action buttons footer */}
                                                <div className="border-t border-slate-100 pt-4 mt-auto space-y-3">
                                                    {doc.current_stage_id === 1 && (
                                                        <button
                                                            onClick={handleSavePositions}
                                                            className="w-full h-11 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                        >
                                                            <RotateCcw size={12} /> Save Placements
                                                        </button>
                                                    )}

                                                    {hasCurrentUserSigned ? (
                                                        <button
                                                            onClick={() => handleTransition('UNAPPROVE')}
                                                            className="w-full h-11 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                                        >
                                                            <RotateCcw size={12} /> Revoke Seal Signature
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleTransition('APPROVE')}
                                                            disabled={isVerifying || isSigning || (doc.current_stage_id === 1 && signers.some(s => s.x_pos === 0))}
                                                            className={cn(
                                                                "w-full h-12 text-white font-bold flex items-center justify-center gap-2 text-xs rounded-lg transition-all shadow-md active:scale-95",
                                                                isVerifying ? "bg-emerald animate-pulse" : "bg-primary hover:bg-primary/95",
                                                                (doc.current_stage_id === 1 && signers.some(s => s.x_pos === 0)) && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                                            )}
                                                        >
                                                            {isVerifying ? (
                                                                <><Hash className="animate-spin" size={14} /> Sealing Document...</>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 size={16} /> 
                                                                    {doc.current_stage_id === 1 ? 'Publish to Reviewers' : (
                                                                        doc.current_stage_id === 3 && allApproversHaveSigned && currentUserSigner ? 'Final Approve & Close' : 'Approve & Sign'
                                                                    )}
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    {doc.current_stage_id > 1 && !hasCurrentUserSigned && (
                                                        <button
                                                            onClick={() => handleTransition('RETURN')}
                                                            disabled={isVerifying || isSigning}
                                                            className="w-full h-11 bg-amber-50 border border-amber-250 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                                        >
                                                            <RotateCcw size={12} /> Return to Author
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : isUserAStakeholder ? (
                                            <div className="flex-1 flex flex-col justify-center text-center py-10 animate-in fade-in duration-300">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-inner">
                                                    <FileText size={20} />
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-sm mb-1">
                                                    {currentUserSignerRole === 'Reviewer' && doc?.current_stage_id > 2 ? 'Review Complete' : 
                                                     currentUserSignerRole === 'Approver' && doc?.current_stage_id < 3 ? 'Awaiting Approval Stage' :
                                                     'Compliance Workflow Active'}
                                                </h3>
                                                <p className="text-[10px] text-slate-500 leading-relaxed px-4">
                                                    {currentUserSignerRole === 'Reviewer' && doc?.current_stage_id === 2 ? 
                                                        "Review phase is active. Provide your feedback above." :
                                                    currentUserSignerRole === 'Reviewer' && doc?.current_stage_id > 2 ? 
                                                        "Your review is complete. Document is now awaiting approval." :
                                                    currentUserSignerRole === 'Approver' && doc?.current_stage_id === 2 ?
                                                        "Document is currently in review phase. You will be notified when approval is needed." :
                                                    currentUserSignerRole === 'Approver' && doc?.current_stage_id === 3 ?
                                                        "Approval phase is active. Provide your feedback above." :
                                                    "Workflow transitions are active. Respective role holders will sign next."}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col justify-center text-center py-10 animate-in fade-in duration-300">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                                                    <HelpCircle size={20} />
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-sm mb-1">Workflow Entitlements</h3>
                                                <p className="text-[10px] text-slate-500 leading-relaxed px-4">
                                                    You can preview this document, but your role does not possess permissions to sign or return it.
                                                </p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-center text-center py-10 animate-in fade-in duration-300">
                                            <div className="w-12 h-12 rounded-full bg-emerald/10 text-emerald flex items-center justify-center mx-auto mb-3 shadow-inner">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-sm mb-1">Document Submitted</h3>
                                            <p className="text-[10px] text-slate-500 leading-relaxed px-4">
                                                Your document is in the workflow stream. View the timeline changes by clicking "View Audit Trail" above.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 mt-12 animate-in fade-in duration-300">
                            <button 
                                onClick={() => { setRightPanelCollapsed(false); setShowTrail(true); }}
                                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-primary hover:text-white transition-all shadow-sm"
                                title="Open Event Logs"
                            >
                                <History size={14} />
                            </button>
                            <button 
                                onClick={() => { setRightPanelCollapsed(false); setShowTrail(false); }}
                                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-primary hover:text-white transition-all shadow-sm"
                                title="Open Action Panel"
                            >
                                <MessageSquare size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Electronic signature Biometric sealing container */}
            {isSigning && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <SignaturePad
                        userId={localStorage.getItem('sim_user_id') || (doc.current_stage_id === 1 ? doc.author_id : 1)}
                        onSave={onSignatureComplete}
                        onCancel={() => setIsSigning(false)}
                    />
                </div>
            )}

            {/* Integrity Overlay */}
            {isVerifying && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                        <div className="w-16 h-16 bg-[#009688]/10 text-[#009688] rounded-full flex items-center justify-center animate-pulse border border-[#009688]/20">
                            <Hash size={32} />
                        </div>
                        <h3 className="text-white font-extrabold text-lg tracking-tight">SOC 2 Compliance Sealing</h3>
                        <p className="text-slate-400 text-xs leading-relaxed font-medium">Encrypting final document nodes, verifying signer credentials, and writing cryptographical ledger signatures...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentReviewView;
