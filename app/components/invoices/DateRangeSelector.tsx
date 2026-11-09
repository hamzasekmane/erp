// app/components/invoices/DateRangeSelector.tsx
'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, X, Check } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DateRangeHelper, InvoiceFilters } from '@/app/services/invoice.service';

interface DateRangeSelectorProps {
  currentFilters: InvoiceFilters;
}

const DATE_RANGES = [
  { value: 'today', label: 'اليوم', icon: '📅' },
  { value: 'yesterday', label: 'أمس', icon: '⬅️' },
  { value: 'this_week', label: 'هذا الأسبوع', icon: '📆' },
  { value: 'last_week', label: 'الأسبوع الماضي', icon: '⬅️📆' },
  { value: 'this_month', label: 'هذا الشهر', icon: '📅' },
  { value: 'last_month', label: 'الشهر الماضي', icon: '⬅️📅' },
  { value: 'this_quarter', label: 'هذا الربع', icon: '📊' },
  { value: 'last_quarter', label: 'الربع الماضي', icon: '⬅️📊' },
  { value: 'this_year', label: 'هذه السنة', icon: '📅' },
  { value: 'last_year', label: 'السنة الماضية', icon: '⬅️📅' },
  { value: 'custom', label: 'تخصيص', icon: '✏️' },
];

const MONTHS = [
  { value: '01', label: 'جانفي' },
  { value: '02', label: 'فيفري' },
  { value: '03', label: 'مارس' },
  { value: '04', label: 'أفريل' },
  { value: '05', label: 'ماي' },
  { value: '06', label: 'جوان' },
  { value: '07', label: 'جويلية' },
  { value: '08', label: 'أوت' },
  { value: '09', label: 'سبتمبر' },
  { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نوفمبر' },
  { value: '12', label: 'ديسمبر' },
];

export default function DateRangeSelector({ currentFilters }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // تحديد النطاق الزمني النشط
  const activeRange = currentFilters.dateRange || '';
  const activeMonth = currentFilters.month || '';

  const getActiveLabel = () => {
    if (activeRange && activeRange !== 'custom') {
      return DATE_RANGES.find(r => r.value === activeRange)?.label || 'اختر فترة';
    }
    if (activeMonth) {
      const [year, month] = activeMonth.split('-');
      const monthName = MONTHS.find(m => m.value === month)?.label || '';
      return `${monthName} ${year}`;
    }
    if (currentFilters.startDate && currentFilters.endDate) {
      return 'فترة مخصصة';
    }
    return 'كل الفترات';
  };

  const applyDateRange = (range: string) => {
    const params = new URLSearchParams(searchParams);
    
    // إزالة الفلاتر السابقة
    params.delete('dateRange');
    params.delete('month');
    params.delete('fromDate');
    params.delete('toDate');
    
    if (range === 'custom') {
      setShowCustom(true);
      return;
    }
    
    if (range) {
      params.set('dateRange', range);
    }
    
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const applyMonth = () => {
    if (!selectedMonth) return;
    
    const params = new URLSearchParams(searchParams);
    params.delete('dateRange');
    params.delete('month');
    params.delete('fromDate');
    params.delete('toDate');
    
    params.set('month', `${selectedYear}-${selectedMonth}`);
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
    setShowCustom(false);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    
    const params = new URLSearchParams(searchParams);
    params.delete('dateRange');
    params.delete('month');
    params.delete('fromDate');
    params.delete('toDate');
    
    params.set('fromDate', customStart);
    params.set('toDate', customEnd);
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
    setShowCustom(false);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('dateRange');
    params.delete('month');
    params.delete('fromDate');
    params.delete('toDate');
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
    setShowCustom(false);
  };

  // الحصول على السنوات للاختيار
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-4 bg-white/5 backdrop-blur-md border rounded-2xl transition-all group ${
          activeRange || activeMonth || (currentFilters.startDate && currentFilters.endDate)
            ? 'border-cyan-500/50 bg-cyan-500/10' 
            : 'border-white/10 hover:bg-white/10'
        }`}
      >
        <Calendar size={18} className={activeRange || activeMonth ? 'text-cyan-400' : 'text-zinc-400 group-hover:text-cyan-400 transition-colors'} />
        <span className={`text-[10px] font-black uppercase tracking-wider ${
          activeRange || activeMonth ? 'text-cyan-400' : 'text-zinc-400'
        }`}>
          {getActiveLabel()}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${
          activeRange || activeMonth ? 'text-cyan-400' : 'text-zinc-400'
        }`} />
      </button>

      {isOpen && (
        <>
          {/* الخلفية المعتمة */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowCustom(false);
            }}
          />

          {/* القائمة المنسدلة */}
          <div className="absolute left-0 mt-2 w-80 z-50">
            <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
              
              {showCustom ? (
                /* وضع التخصيص */
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-white">تخصيص الفترة</h3>
                    <button 
                      onClick={() => setShowCustom(false)}
                      className="p-1 hover:bg-white/10 rounded-lg"
                    >
                      <X size={14} className="text-zinc-400" />
                    </button>
                  </div>

                  {/* اختيار شهر */}
                  <div className="mb-4">
                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-2 block">
                      أو اختر شهراً محدداً
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="">اختر الشهر</option>
                        {MONTHS.map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    {selectedMonth && (
                      <button
                        onClick={applyMonth}
                        className="w-full mt-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
                      >
                        تطبيق الشهر
                      </button>
                    )}
                  </div>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-[8px]">
                      <span className="px-2 bg-zinc-900 text-zinc-500">أو</span>
                    </div>
                  </div>

                  {/* تواريخ مخصصة */}
                  <div className="space-y-3">
                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block">
                      اختر تواريخ مخصصة
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                      placeholder="من تاريخ"
                    />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                      placeholder="إلى تاريخ"
                    />
                    {customStart && customEnd && (
                      <button
                        onClick={applyCustomRange}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-95 transition-all"
                      >
                        تطبيق التخصيص
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* قائمة النطاقات الزمنية */
                <>
                  <div className="p-3 border-b border-white/10">
                    <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider text-center">
                      تصفية حسب الفترة
                    </h3>
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {/* خيار كل الفترات */}
                    <button
                      onClick={clearFilters}
                      className={`w-full text-right px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                        !activeRange && !activeMonth && !currentFilters.startDate
                          ? 'bg-cyan-500/20 text-cyan-400' 
                          : 'hover:bg-white/5 text-zinc-300'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">📋</span>
                        <span className="text-xs font-bold">كل الفترات</span>
                      </span>
                      {!activeRange && !activeMonth && !currentFilters.startDate && (
                        <Check size={14} className="text-cyan-400" />
                      )}
                    </button>

                    {/* النطاقات الزمنية المحددة مسبقاً */}
                    {DATE_RANGES.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => applyDateRange(range.value)}
                        className={`w-full text-right px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                          activeRange === range.value 
                            ? 'bg-cyan-500/20 text-cyan-400' 
                            : 'hover:bg-white/5 text-zinc-300'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-lg">{range.icon}</span>
                          <span className="text-xs font-bold">{range.label}</span>
                        </span>
                        {activeRange === range.value && (
                          <Check size={14} className="text-cyan-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* زر إلغاء الفلترة */}
                  {(activeRange || activeMonth || (currentFilters.startDate && currentFilters.endDate)) && (
                    <div className="p-3 border-t border-white/10">
                      <button
                        onClick={clearFilters}
                        className="w-full text-rose-400 hover:bg-rose-500/10 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        إلغاء التصفية
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}