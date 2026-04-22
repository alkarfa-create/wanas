'use client'

import { useState } from 'react';
import AdminProRequestsTable from './AdminProRequestsTable';

export default function AdminPriorities({ todayRequests }: { todayRequests: number }) {
    const [showProRequests, setShowProRequests] = useState(false);

    return (
        <div className="w-full">
            {/* Today's Priorities (يحتاج قرار الآن) */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm border-dashed">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <h3 className="font-black text-amber-900 text-lg">يحتاج قرار الآن</h3>
                </div>
                
                {/* Interactive toggle button */}
                <button 
                    onClick={() => setShowProRequests(!showProRequests)}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-black text-sm border transition-all active:scale-95 ${
                        showProRequests 
                        ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-inner' 
                        : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-100 shadow-sm'
                    }`}
                >
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] animate-pulse">نشط</span>
                    {todayRequests > 0 ? `${todayRequests} طلب PRO جديد اليوم` : 'طلبات تفعيل PRO'}
                    <span className="text-xs transition-transform duration-300 transform">
                        {showProRequests ? '▲' : '▼'}
                    </span>
                </button>
            </div>

            {/* 🌟 PRO Requests Table (Conditional Rendering) */}
            {showProRequests && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <AdminProRequestsTable />
                </div>
            )}
        </div>
    );
}
