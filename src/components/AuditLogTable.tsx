import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLog[];
  onLogsDeleted?: () => void;
  currentUserId?: string;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, onLogsDeleted, currentUserId }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear selections that are no longer present in the logs
  useEffect(() => {
    const validIds = new Set(logs.map(l => l.id));
    setSelectedIds(prev => {
      const next = new Set<string>();
      prev.forEach(id => {
        if (validIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
    setConfirming(false);
    setError(null);
  }, [logs]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allDisplayedIds = logs.map(l => l.id);
  const allSelected = allDisplayedIds.length > 0 && allDisplayedIds.every(id => selectedIds.has(id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allDisplayedIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allDisplayedIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      const res = await fetch('/api/audit-logs/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId || 'usr-admin-1'
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (!res.ok) {
        throw new Error('Failed to delete selected logs');
      }

      setSelectedIds(new Set());
      setConfirming(false);
      if (onLogsDeleted) {
        onLogsDeleted();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4" id="audit-log-table-wrapper">
      {/* Bulk Action Header Banner */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-rose-50 border border-rose-100 rounded-xl px-5 py-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5 text-rose-800 font-bold">
            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </div>
            <span>{selectedIds.size} {selectedIds.size === 1 ? 'log entry' : 'log entries'} selected for bulk removal</span>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <span className="text-rose-600 font-semibold flex items-center gap-1 bg-white border border-rose-150 rounded-lg px-2.5 py-1">
                <AlertTriangle className="h-3 w-3" />
                Error: {error}
              </span>
            )}
            
            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-600 font-semibold mr-1">Proceed with permanent deletion?</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {deleting && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Yes, Delete Selected
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm" id="audit-log-table-component">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    aria-label="Select all visible logs"
                  />
                </th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {logs.map((log) => {
                let actionColor = "bg-slate-100 text-slate-600";
                if (log.action.includes("LOGIN") || log.action.includes("REGISTER")) {
                  actionColor = "bg-blue-50 text-blue-700 border border-blue-100";
                } else if (log.action.includes("SUBMIT")) {
                  actionColor = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                } else if (log.action.includes("CREATE")) {
                  actionColor = "bg-violet-50 text-violet-700 border border-violet-100";
                } else if (log.action.includes("GRADE")) {
                  actionColor = "bg-amber-50 text-amber-700 border border-amber-100";
                } else if (log.action.includes("SWITCH")) {
                  actionColor = "bg-slate-100 text-slate-700 border border-slate-200";
                } else if (log.action.includes("SYSTEM") || log.action.includes("FAILED")) {
                  actionColor = "bg-rose-50 text-rose-700 border border-rose-100";
                }

                const isSelected = selectedIds.has(log.id);

                return (
                  <tr 
                    key={log.id} 
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isSelected ? 'bg-rose-50/10 hover:bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(log.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        aria-label={`Select log entry ${log.id}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] uppercase text-white ${
                          log.userRole === 'admin' ? 'bg-rose-500' : log.userRole === 'teacher' ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}>
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            {log.userName}
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                              log.userRole === 'admin' ? 'bg-rose-50 text-rose-600' : log.userRole === 'teacher' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {log.userRole}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">{log.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${actionColor}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 max-w-xs md:max-w-md break-words">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-mono text-slate-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No events found matching the current criteria in the audit trail.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AuditLogTable);
