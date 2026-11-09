export function UsageStats({ usage }: { usage: any }) {
  const userPercent = (usage.users.used / usage.users.limit) * 100;
  const storagePercent = (usage.storage.used / usage.storage.limit) * 100;
  const apiPercent = (usage.apiCalls.used / usage.apiCalls.limit) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
      <div>
        <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Utilisateurs</p>
        <p className="text-xl font-black">{usage.users.used} / {usage.users.limit}</p>
        <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
          <div className="w-[25%] h-full bg-[var(--accent)] rounded-full" style={{ width: `${userPercent}%` }} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Stockage utilisé</p>
        <p className="text-xl font-black">{usage.storage.used} / {usage.storage.limit} {usage.storage.unit}</p>
        <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
          <div className="w-[17%] h-full bg-emerald-500 rounded-full" style={{ width: `${storagePercent}%` }} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">API Appels</p>
        <p className="text-xl font-black">{usage.apiCalls.used.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}</p>
        <div className="w-full h-1 bg-[var(--border)] rounded-full mt-2 overflow-hidden">
          <div className="w-[45%] h-full bg-blue-500 rounded-full" style={{ width: `${apiPercent}%` }} />
        </div>
      </div>
    </div>
  );
}