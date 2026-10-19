import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { MousePointer2, Eraser, CheckSquare, Upload, Type } from 'lucide-react';
import { docService } from '../services/docService';

const SignaturePad = ({ userId, onSave, onCancel }) => {
    const sigCanvas = useRef(null);
    const [mode, setMode] = useState('DRAW'); // DRAW, UPLOAD, TYPE
    const [typedName, setTypedName] = useState('');
    const [existingSig, setExistingSig] = useState(null);

    useEffect(() => {
        const fetchSig = async () => {
            try {
                const sig = await docService.getSignature(userId);
                if (sig) setExistingSig(sig.signature_data);
            } catch (e) { console.error(e); }
        };
        fetchSig();
    }, [userId]);

    const clear = () => sigCanvas.current?.clear();

    const handleSave = () => {
        let signatureData = '';
        if (mode === 'DRAW') {
            if (sigCanvas.current.isEmpty()) return alert("Please provide a signature first");
            signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        } else if (mode === 'TYPE') {
            if (!typedName) return alert("Please type your name");
            // In a real app, convert text to image using canvas
            const canvas = document.createElement('canvas');
            canvas.width = 400; canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.font = 'italic 36px "Dancing Script", cursive';
            ctx.fillText(typedName, 20, 60);
            signatureData = canvas.toDataURL('image/png');
        }

        docService.saveSignature({
            user_id: userId,
            signature_data: signatureData,
            signature_type: mode
        }).then(() => {
            onSave(signatureData);
        });
    };

    return (
        <div className="bg-white rounded-8px shadow-2xl p-6 w-[500px] border border-gray-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-professional-onyx mb-4 flex items-center gap-2">
                <MousePointer2 size={20} className="text-professional-cobalt" /> Apply Digital Signature
            </h3>

            <div className="flex bg-gray-100 p-1 rounded-8px mb-4">
                {[
                    { id: 'DRAW', label: 'Draw', icon: MousePointer2 },
                    { id: 'TYPE', label: 'Type', icon: Type },
                    { id: 'UPLOAD', label: 'Upload', icon: Upload }
                ].map(m => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-6px transition-all flex items-center justify-center gap-2 ${mode === m.id ? "bg-white shadow-sm text-professional-cobalt" : "text-professional-slate"
                            }`}
                    >
                        <m.icon size={14} /> {m.label}
                    </button>
                ))}
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-8px bg-slate-50 relative h-48 flex items-center justify-center overflow-hidden">
                {mode === 'DRAW' && (
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor='#010B13'
                        canvasProps={{ className: 'sigCanvas w-full h-full' }}
                    />
                )}
                {mode === 'TYPE' && (
                    <input
                        type="text"
                        placeholder="Type your formal name..."
                        className="bg-transparent border-b-2 border-professional-cobalt text-3xl font-serif text-center focus:outline-none w-3/4 italic"
                        value={typedName}
                        onChange={(e) => setTypedName(e.target.value)}
                    />
                )}
                {mode === 'UPLOAD' && (
                    <div className="text-center text-professional-slate">
                        <Upload size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-[10px]">Upload signature image (PNG/JPG)</p>
                    </div>
                )}

                {mode === 'DRAW' && (
                    <button onClick={clear} className="absolute bottom-2 right-2 p-1.5 hover:bg-gray-200 rounded-full transition-colors text-professional-slate">
                        <Eraser size={16} />
                    </button>
                )}
            </div>

            <div className="mt-6 flex gap-3">
                <button
                    onClick={handleSave}
                    className="btn-primary flex-1 h-12 font-bold flex items-center justify-center gap-2"
                >
                    <CheckSquare size={18} /> Seal Signature
                </button>
                <button
                    onClick={onCancel}
                    className="btn-secondary flex-1 h-12 font-bold text-professional-ruby hover:bg-ruby-50 border-none"
                >
                    Cancel
                </button>
            </div>

            {existingSig && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[8px] font-bold text-professional-slate uppercase mb-2">Saved Signature</p>
                    <img src={existingSig} alt="Existing Signature" className="h-10 opacity-50 contrast-125" />
                </div>
            )}
        </div>
    );
};

export default SignaturePad;
