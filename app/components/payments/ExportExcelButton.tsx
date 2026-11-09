"use client";

import * as XLSX from "xlsx";
import { FileSpreadsheet, Loader2, Download } from "lucide-react";
import { useState } from "react";

interface ExportExcelButtonProps {
  data: any[] | { data?: any[]; [key: string]: any };
  fileName?: string;
  sheetName?: string;
  buttonText?: string;
  showIcon?: boolean;
  className?: string;
  onSuccess?: (fileName: string, rowCount: number) => void;
  onError?: (error: Error) => void;
}

export default function ExportExcelButton({ 
  data, 
  fileName = `Rapport_Paiements_${new Date().getTime()}`,
  sheetName = "Paiements",
  buttonText = "Exporter Excel",
  showIcon = true,
  className = "",
  onSuccess,
  onError
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractDataArray = (inputData: any): any[] => {
    // إذا كانت المصفوفة مباشرة
    if (Array.isArray(inputData)) {
      return inputData;
    }
    
    // إذا كان كائن ويحتوي على خاصية data
    if (inputData && typeof inputData === 'object') {
      // تحقق من وجود data كمصفوفة
      if ('data' in inputData && Array.isArray(inputData.data)) {
        return inputData.data;
      }
      
      // تحقق من وجود payments أو items
      if ('payments' in inputData && Array.isArray(inputData.payments)) {
        return inputData.payments;
      }
      if ('items' in inputData && Array.isArray(inputData.items)) {
        return inputData.items;
      }
      
      // إذا كان الكائن نفسه ليس مصفوفة، حاول تحويله
      return [];
    }
    
    return [];
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(10);

    try {
      // استخراج المصفوفة الفعلية من البيانات
      const paymentsArray = extractDataArray(data);
      
      // التحقق من وجود بيانات
      if (!paymentsArray || paymentsArray.length === 0) {
        console.warn("⚠️ لا توجد بيانات للتصدير", { data, paymentsArray });
        alert("⚠️ لا توجد بيانات للتصدير. يرجى التأكد من وجود مدفوعات في النظام.");
        setIsExporting(false);
        setProgress(0);
        return;
      }

      setProgress(30);
      console.log(`📊 جاري تصدير ${paymentsArray.length} عنصر...`);

      // تجهيز البيانات وتصفيتها للأعمدة المطلوبة فقط
      const reportData = paymentsArray.map((item, index) => {
        // معالجة التاريخ
        let dateStr = "N/A";
        if (item.createdAt) {
          try {
            dateStr = new Date(item.createdAt).toLocaleDateString('fr-FR');
          } catch (e) {
            dateStr = String(item.createdAt);
          }
        } else if (item.date) {
          try {
            dateStr = new Date(item.date).toLocaleDateString('fr-FR');
          } catch (e) {
            dateStr = String(item.date);
          }
        }

        return {
          "Référence": item.paymentNumber || item.reference || item._id?.toString().slice(-6).toUpperCase() || `ITEM-${index + 1}`,
          "Date": dateStr,
          "Client": item.clientId?.name || item.clientName || item.client || "Client Général",
          "Facture": item.invoiceId?.invoiceNumber || item.invoiceNumber || item.invoice || "N/A",
          "Montant (DZA)": item.amount || item.montant || 0,
          "Méthode": (item.method || item.paymentMethod || "N/A").toUpperCase(),
          "Statut": (item.status || "N/A").toUpperCase(),
          "Transaction ID": item.transactionId || item.transaction || "N/A",
          "Notes": item.notes || item.description || ""
        };
      });

      setProgress(60);

      // إنشاء كتاب العمل (Workbook) والورقة (Worksheet)
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      
      // تعديل عرض الأعمدة تلقائياً
      const colWidths = calculateColumnWidths(reportData);
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      setProgress(80);

      // إضافة ورقة ملخص إذا كان هناك أكثر من 10 عناصر
      if (paymentsArray.length > 10) {
        addSummarySheet(workbook, paymentsArray, "Résumé");
      }

      // تصدير الملف
      const fullFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
      XLSX.writeFile(workbook, fullFileName);
      
      setProgress(100);
      
      // نجاح التصدير
      console.log(`✅ تم تصدير ${paymentsArray.length} عنصر بنجاح`);
      
      if (onSuccess) {
        onSuccess(fullFileName, paymentsArray.length);
      } else {
        // رسالة نجاح اختيارية
        setTimeout(() => {
          alert(`✅ تم تصدير ${paymentsArray.length} عنصر بنجاح`);
        }, 100);
      }
      
    } catch (error) {
      console.error("❌ خطأ في تصدير الملف:", error);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      } else {
        alert("❌ حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.");
      }
      
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  // دالة مساعدة لحساب عرض الأعمدة
  const calculateColumnWidths = (data: any[]) => {
    if (data.length === 0) return [];
    
    const headers = Object.keys(data[0]);
    const widths = headers.map(h => h.length);
    
    data.forEach(row => {
      headers.forEach((header, i) => {
        const value = String(row[header] || '');
        widths[i] = Math.max(widths[i], Math.min(value.length, 50)); // حد أقصى 50 حرف
      });
    });
    
    return widths.map(w => ({ wch: w + 2 })); // إضافة مسافة
  };

  // دالة مساعدة لإضافة ورقة ملخص
  const addSummarySheet = (workbook: XLSX.WorkBook, data: any[], sheetName: string) => {
    try {
      // حساب الإحصائيات
      const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      // إحصائيات حسب الحالة
      const statusStats: Record<string, number> = {};
      data.forEach(item => {
        const status = item.status || 'inconnu';
        statusStats[status] = (statusStats[status] || 0) + 1;
      });
      
      // إحصائيات حسب الطريقة
      const methodStats: Record<string, number> = {};
      data.forEach(item => {
        const method = item.method || 'inconnu';
        methodStats[method] = (methodStats[method] || 0) + 1;
      });

      const summaryData = [
        { 'Indicateur': 'Total des éléments', 'Valeur': data.length },
        { 'Indicateur': 'Montant total', 'Valeur': `${totalAmount.toLocaleString('fr-FR')} DZA` },
        { 'Indicateur': '', 'Valeur': '' },
        { 'Indicateur': 'RÉPARTITION PAR STATUT', 'Valeur': '' },
        ...Object.entries(statusStats).map(([status, count]) => ({
          'Indicateur': `  ${status}`,
          'Valeur': count
        })),
        { 'Indicateur': '', 'Valeur': '' },
        { 'Indicateur': 'RÉPARTITION PAR MÉTHODE', 'Valeur': '' },
        ...Object.entries(methodStats).map(([method, count]) => ({
          'Indicateur': `  ${method}`,
          'Valeur': count
        }))
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      
      // تعديل عرض أعمدة ورقة الملخص
      summarySheet['!cols'] = [
        { wch: 30 },
        { wch: 20 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, sheetName);
    } catch (error) {
      console.warn("⚠️ فشل في إضافة ورقة الملخص:", error);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 ${className}`}
    >
      {isExporting ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>{buttonText === "Exporter Excel" ? "Exportation..." : buttonText}</span>
          {progress > 0 && progress < 100 && (
            <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[8px] rounded-full w-5 h-5 flex items-center justify-center">
              {progress}%
            </span>
          )}
        </>
      ) : (
        <>
          {showIcon && <FileSpreadsheet size={14} />}
          <span>{buttonText}</span>
          {data && (
            <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[8px] rounded-full w-5 h-5 flex items-center justify-center">
              {Array.isArray(data) ? data.length : data?.data?.length || 0}
            </span>
          )}
        </>
      )}
    </button>
  );
}