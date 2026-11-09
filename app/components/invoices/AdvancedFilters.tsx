// app/components/invoices/AdvancedFilters.tsx
'use client';

import { useState } from 'react';
import { Filter, X, Check, DollarSign, User, Tag, ArrowUpDown } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { InvoiceFilters } from '@/app/services/invoice.service';

// تعريف نوع لخيارات الفرز
type SortField = 'date' | 'dueDate' | 'total' | 'createdAt' | 'invoiceNumber' | 'clientName';
type SortOrder = 'asc' | 'desc';

interface AdvancedFiltersProps {
  currentFilters: InvoiceFilters;
}

const SORT_OPTIONS: { value: SortField; label: string; icon: string }[] = [
  { value: 'date', label: 'التاريخ', icon: '📅' },
  { value: 'dueDate', label: 'تاريخ الاستحقاق', icon: '⏰' },
  { value: 'total', label: 'المبلغ', icon: '💰' },
  { value: 'createdAt', label: 'تاريخ الإنشاء', icon: '🕐' },
  { value: 'invoiceNumber', label: 'رقم الفاتورة', icon: '🔢' },
  { value: 'clientName', label: 'اسم العميل', icon: '👤' },
];

const STATUS_OPTIONS = [
  { value: 'paid', label: 'مدفوعة', color: 'emerald' },
  { value: 'partially_paid', label: 'مدفوعة جزئياً', color: 'amber' },
  { value: 'sent', label: 'مرسلة', color: 'blue' },
  { value: 'draft', label: 'مسودة', color: 'zinc' },
  { value: 'overdue', label: 'متأخرة', color: 'rose' },
  { value: 'cancelled', label: 'ملغية', color: 'zinc' },
];

export default function AdvancedFilters({ currentFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minAmount, setMinAmount] = useState(currentFilters.minAmount?.toString() || '');
  const [maxAmount, setMaxAmount] = useState(currentFilters.maxAmount?.toString() || '');
  const [clientId, setClientId] = useState(currentFilters.clientId || '');
  
  // تحديد النوع بشكل صريح
  const [sortBy, setSortBy] = useState<SortField>(currentFilters.sortBy || 'date');
  const [sortOrder, setSortOrder] = useState<SortOrder>(currentFilters.sortOrder || 'desc');

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // حساب عدد الفلاتر النشطة
  const getActiveFiltersCount = () => {
    let count = 0;
    if (currentFilters.minAmount) count++;
    if (currentFilters.maxAmount) count++;
    if (currentFilters.clientId) count++;
    if (currentFilters.sortBy && currentFilters.sortBy !== 'date') count++;
    if (currentFilters.sortOrder && currentFilters.sortOrder !== 'desc') count++;
    return count;
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    // تحديث فلاتر المبلغ
    if (minAmount) {
      params.set('minAmount', minAmount);
    } else {
      params.delete('minAmount');
    }
    
    if (maxAmount) {
      params.set('maxAmount', maxAmount);
    } else {
      params.delete('maxAmount');
    }
    
    // تحديث فلتر العميل
    if (clientId) {
      params.set('clientId', clientId);
    } else {
      params.delete('clientId');
    }
    
    // تحديث خيارات الفرز
    if (sortBy && sortBy !== 'date') {
      params.set('sortBy', sortBy);
    } else {
      params.delete('sortBy');
    }
    
    if (sortOrder && sortOrder !== 'desc') {
      params.set('sortOrder', sortOrder);
    } else {
      params.delete('sortOrder');
    }
    
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('minAmount');
    params.delete('maxAmount');
    params.delete('clientId');
    params.delete('sortBy');
    params.delete('sortOrder');
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
    setMinAmount('');
    setMaxAmount('');
    setClientId('');
    setSortBy('date');
    setSortOrder('desc');
    setIsOpen(false);
  };

  // معالج تغيير الفرز مع تحديد النوع
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SortField;
    setSortBy(value);
  };

  // معالج تغيير ترتيب الفرز
  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SortOrder;
    setSortOrder(value);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
      >
        <Filter size={18} className="text-zinc-400 group-hover:text-cyan-400 transition-colors" />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full text-[8px] font-black flex items-center justify-center text-black animate-pulse">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* الخلفية المعتمة */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* نافذة الفلاتر المتقدمة */}
          <div className="absolute right-0 mt-2 w-96 z-50">
            <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
              
              {/* الرأس */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-black text-white">فلاتر متقدمة</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X size={14} className="text-zinc-400" />
                </button>
              </div>

              {/* المحتوى */}
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                
                {/* فلترة المبلغ */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                    <DollarSign size={12} />
                    نطاق المبلغ
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        placeholder="الحد الأدنى"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-600"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        placeholder="الحد الأقصى"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-600"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* فلترة العميل */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                    <User size={12} />
                    العميل
                  </label>
                  
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                  >
                    <option value="">كل العملاء</option>
                    <option value="client1">عميل 1</option>
                    <option value="client2">عميل 2</option>
                    {/* سيتم جلب العملاء من API لاحقاً */}
                  </select>
                </div>

                {/* خيارات الفرز المتقدم */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                    <ArrowUpDown size={12} />
                    ترتيب متقدم
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={sortBy}
                      onChange={handleSortByChange}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                    >
                      {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={sortOrder}
                      onChange={handleSortOrderChange}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                    >
                      <option value="desc">تنازلي (الأحدث)</option>
                      <option value="asc">تصاعدي (الأقدم)</option>
                    </select>
                  </div>
                </div>

                {/* إحصائيات سريعة */}
                <div className="bg-white/5 rounded-xl p-3">
                  <h4 className="text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-2">
                    الفلاتر الحالية
                  </h4>
                  <div className="space-y-1">
                    {currentFilters.status && (
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-zinc-400">الحالة:</span>
                        <span className="text-[8px] font-bold text-white">
                          {STATUS_OPTIONS.find(s => s.value === currentFilters.status)?.label || currentFilters.status}
                        </span>
                      </div>
                    )}
                    {currentFilters.minAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-zinc-400">الحد الأدنى:</span>
                        <span className="text-[8px] font-bold text-white">{currentFilters.minAmount} د.ج</span>
                      </div>
                    )}
                    {currentFilters.maxAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-zinc-400">الحد الأقصى:</span>
                        <span className="text-[8px] font-bold text-white">{currentFilters.maxAmount} د.ج</span>
                      </div>
                    )}
                    {!currentFilters.status && !currentFilters.minAmount && !currentFilters.maxAmount && (
                      <p className="text-[8px] text-zinc-600 text-center">لا توجد فلاتر نشطة</p>
                    )}
                  </div>
                </div>
              </div>

              {/* الأزرار */}
              <div className="p-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={applyFilters}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-95 transition-all"
                >
                  تطبيق الفلاتر
                </button>
                <button
                  onClick={clearFilters}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:bg-white/10 transition-all"
                >
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}