import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { Shield, Clock, FileText, CheckCircle2, AlertTriangle, BadgeAlert } from 'lucide-react';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const KpiCard = ({ title, value, badge, icon: Icon, colorClass }) => (
    <div className={cn("bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)] p-6 border border-slate-100 flex flex-col justify-between relative", colorClass)}>
        <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
            {Icon && (
                <div className={cn("p-1.5 rounded-lg", 
                    colorClass?.includes('emerald') ? 'bg-[#009688]/10 text-[#009688]' :
                    colorClass?.includes('cobalt') ? 'bg-[#1D76D2]/10 text-[#1D76D2]' :
                    colorClass?.includes('amber') ? 'bg-[#FF9800]/10 text-[#FF9800]' :
                    'bg-[#D32F2F]/10 text-[#D32F2F]'
                )}>
                    <Icon size={16} />
                </div>
            )}
        </div>
        
        <div className="flex items-end justify-between mt-5">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{value}</span>
            {badge && (
                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", badge.className)}>
                    {badge.text}
                </span>
            )}
        </div>
    </div>
);

export const StatusBadge = ({ status }) => {
    const styles = {
        'UNDER_REVIEW': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400',
        'DRAFT': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
        'CLOSED': 'bg-[#009688]/10 text-[#009688] border-[#009688]/20',
        'PENDING_REVIEW': 'bg-amber-50 text-amber-700 border-amber-100',
        'PENDING_APPROVAL': 'bg-blue-50 text-[#1D76D2] border-blue-100',
        'RETURNED_FOR_FIX': 'bg-[#D32F2F]/10 text-[#D32F2F] border-[#D32F2F]/20',
    };

    return (
        <span className={cn(
            "px-2.5 py-1 text-[9px] font-black rounded border uppercase tracking-widest inline-flex items-center gap-1",
            styles[status] || styles['DRAFT']
        )}>
            <span className={cn("w-1 h-1 rounded-full",
                status === 'CLOSED' ? 'bg-[#009688]' :
                status === 'RETURNED_FOR_FIX' ? 'bg-[#D32F2F]' :
                status === 'DRAFT' ? 'bg-slate-400' :
                'bg-[#FF9800]'
            )} />
            {status.replace(/_/g, ' ')}
        </span>
    );
};

export const StageProgressBar = ({ currentStage }) => {
    const stages = [
        { id: 1, label: 'Draft' },
        { id: 2, label: 'Review' },
        { id: 3, label: 'Approval' },
        { id: 4, label: 'Sealed' }
    ];

    return (
        <div className="flex items-center justify-center gap-2.5 w-full select-none">
            {stages.map((stage, idx) => (
                <React.Fragment key={stage.id}>
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-500 border",
                            currentStage > stage.id ? "bg-[#009688] border-[#009688] text-white shadow-sm" :
                            currentStage === stage.id ? "bg-[#1D76D2] border-[#1D76D2] text-white ring-4 ring-[#1D76D2]/10 shadow-sm" :
                            "bg-white border-slate-200 text-slate-400"
                        )}>
                            {currentStage > stage.id ? '✓' : stage.id}
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider transition-colors duration-500",
                            currentStage > stage.id ? "text-[#009688]" :
                            currentStage === stage.id ? "text-[#1D76D2]" :
                            "text-slate-400"
                        )}>
                            {stage.label}
                        </span>
                    </div>
                    {idx < stages.length - 1 && (
                        <div className={cn(
                            "w-10 sm:w-16 h-[2px] transition-all duration-500",
                            currentStage > stage.id ? "bg-[#009688]" : "bg-slate-200"
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
