// app/components/Dashboard/StockAlert.tsx
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Product } from "@/app/types/dashboard";

interface StockAlertProps {
  product: Product;
}

export default function StockAlert({ product }: StockAlertProps) {
  const stock = product.stock ?? 0;
  const minStock = product.minStock ?? 5;
  const critical = stock === 0;
  const warning = stock > 0 && stock <= minStock;

  if (!critical && !warning) return null;

  return (
    <Link
      href={`/dashboard/products/${product._id}`}
      className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={`p-1 rounded-md ${critical ? 'bg-rose-500/20' : 'bg-amber-500/20'}`}>
          <AlertTriangle size={10} className={critical ? 'text-rose-400' : 'text-amber-400'} />
        </div>
        <div className="flex flex-col truncate">
          <span className="text-[13px] font-black text-[var(--foreground)] truncate">
            {product.name || "Produit"}
          </span>
          <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-tighter">
            Stock: {stock} / {minStock} min
          </span>
        </div>
      </div>
      <div className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
        {critical ? "RUPTURE" : "CRITIQUE"}
      </div>
    </Link>
  );
}