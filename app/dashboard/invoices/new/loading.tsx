// app/dashboard/invoices/new/loading.tsx
import { ArrowLeft } from "lucide-react";

export default function LoadingNewInvoice() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      
      {/* Ghost Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-white/5 border border-white/10">
            <ArrowLeft size={16} className="text-zinc-600" />
          </div>
          <div className="h-4 w-32 bg-white/5 rounded-full" />
        </div>
        <div className="h-8 w-40 bg-white/5 rounded-full border border-white/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Info Skeleton */}
        <div className="lg:col-span-4 space-y-8">
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10" />
          
          <div className="space-y-4">
            <div className="h-12 w-3/4 bg-white/5 rounded-2xl border border-white/10" />
            <div className="h-12 w-1/2 bg-white/5 rounded-2xl border border-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-white/5 rounded-full border border-white/10" />
              <div className="h-3 w-2/3 bg-white/5 rounded-full border border-white/10" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-24 w-full bg-white/5 rounded-[2rem] border border-white/10" />
            <div className="h-24 w-full bg-white/5 rounded-[2rem] border border-white/10" />
          </div>
        </div>

        {/* Right Column: Form Skeleton */}
        <div className="lg:col-span-8 bg-white/5 backdrop-blur-sm rounded-[3.5rem] p-8 border border-white/10">
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-6">
              <div className="h-16 bg-white/10 rounded-2xl border border-white/10" />
              <div className="h-16 bg-white/10 rounded-2xl border border-white/10" />
              <div className="h-16 bg-white/10 rounded-2xl border border-white/10" />
            </div>
            <div className="h-64 bg-white/10 rounded-[2.5rem] border border-white/10" />
            <div className="flex gap-6">
              <div className="h-32 flex-1 bg-white/10 rounded-[2rem] border border-white/10" />
              <div className="h-32 w-64 bg-white/10 rounded-[2rem] border border-white/10" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}