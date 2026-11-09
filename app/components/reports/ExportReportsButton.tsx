"use client";

import * as XLSX from "xlsx";
import { FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ExportReportsButtonProps {
  stats: {
    summary: any[];
    methods: any[];
    daily: any[];
  };
}

export default function ExportReportsButton({ stats }: ExportReportsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // التحقق من وجود بيانات
      const hasData = stats.summary.length > 0 || stats.methods.length > 0 || stats.daily.length > 0;
      
      if (!hasData) {
        alert("⚠️ لا توجد بيانات للتصدير. يرجى التأكد من وجود مدفوعات في النظام.");
        setIsExporting(false);
        return;
      }

      console.log("📊 بيانات التصدير:", stats); // للتشخيص

      const summary = stats.summary[0] || { total: 0, count: 0, avg: 0 };
      
      // إنشاء تقرير ملخص
      const summaryData = [
        { 'Métrique': 'Total Encaissé (DZA)', 'Valeur': summary.total?.toLocaleString('fr-FR') || '0' },
        { 'Métrique': 'Nombre de Transactions', 'Valeur': summary.count || 0 },
        { 'Métrique': 'Moyenne par Transaction', 'Valeur': `${Math.round(summary.avg || 0).toLocaleString('fr-FR')} DZA` },
        { 'Métrique': 'Date du Rapport', 'Valeur': new Date().toLocaleDateString('fr-FR') },
        { 'Métrique': 'Période', 'Valeur': 'Derniers 30 jours' },
      ];

      // تقرير طرق الدفع
      const methodsData = stats.methods.length > 0 
        ? stats.methods.map((m: any) => ({
            'Méthode': m._id || 'Autre',
            'Montant (DZA)': m.total?.toLocaleString('fr-FR') || '0',
            'Transactions': m.count || 0,
            'Moyenne': m.count ? `${Math.round(m.total / m.count).toLocaleString('fr-FR')} DZA` : '0 DZA'
          }))
        : [{ 'Méthode': 'Aucune donnée', 'Montant (DZA)': '0', 'Transactions': 0, 'Moyenne': '0 DZA' }];

      // تقرير يومي
      const dailyData = stats.daily.length > 0
        ? stats.daily.map((d: any) => ({
            'Date': d._id,
            'Montant (DZA)': d.total?.toLocaleString('fr-FR') || '0',
            'Transactions': d.count || 0,
            'Moyenne': d.count ? `${Math.round(d.total / d.count).toLocaleString('fr-FR')} DZA` : '0 DZA'
          }))
        : [{ 'Date': 'Aucune donnée', 'Montant (DZA)': '0', 'Transactions': 0, 'Moyenne': '0 DZA' }];

      // إنشاء workbook
      const wb = XLSX.utils.book_new();

      // إضافة الأوراق
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsMethods = XLSX.utils.json_to_sheet(methodsData);
      const wsDaily = XLSX.utils.json_to_sheet(dailyData);

      // تعديل عرض الأعمدة
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
      wsMethods['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
      wsDaily['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
      
      if (stats.methods.length > 0) {
        XLSX.utils.book_append_sheet(wb, wsMethods, 'Méthodes');
      }
      
      if (stats.daily.length > 0) {
        XLSX.utils.book_append_sheet(wb, wsDaily, 'Journalier');
      }

      // إضافة ورقة معلومات إذا كانت جميع البيانات فارغة
      if (stats.methods.length === 0 && stats.daily.length === 0) {
        const infoData = [
          { 'Information': 'Aucune transaction trouvée pour la période sélectionnée' },
          { 'Information': 'Vérifiez les filtres ou ajoutez des paiements' }
        ];
        const wsInfo = XLSX.utils.json_to_sheet(infoData);
        XLSX.utils.book_append_sheet(wb, wsInfo, 'Information');
      }

      // تصدير الملف
      const fileName = `Rapport_Financier_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      console.log("✅ Rapport exporté avec succès:", fileName);
      
    } catch (error) {
      console.error("❌ Erreur export:", error);
      setError("Erreur lors de l'export");
      alert("❌ Erreur lors de l'export. Vérifiez la console pour plus de détails.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
      >
        {isExporting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Export en cours...
          </>
        ) : (
          <>
            <FileSpreadsheet size={14} />
            Exporter Rapport
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 p-2 bg-rose-100 text-rose-600 text-[8px] rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}