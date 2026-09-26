import React from 'react';
import { Package } from 'lucide-react';

export default function CapacityMeter({ available, total, unit = 'pallets', compact = false, showDetails = true }) {
  const availNum = Math.max(0, parseFloat(available) || 0);
  const totalNum = Math.max(0.1, parseFloat(total) || 1);
  const percentAvail = Math.min(100, Math.round((availNum / totalNum) * 100));

  // Cross-cutting UX rule:
  // >50% available -> Green
  // <30% remaining -> Yellow (30-50% transition)
  // 0% or <= 0 -> Red
  let statusColor = 'bg-emerald-500 text-emerald-800';
  let barColor = 'bg-emerald-500';
  let badgeBorder = 'border-emerald-200 bg-emerald-50';

  if (availNum <= 0) {
    statusColor = 'bg-rose-500 text-rose-800';
    barColor = 'bg-rose-500';
    badgeBorder = 'border-rose-200 bg-rose-50';
  } else if (percentAvail < 30) {
    statusColor = 'bg-amber-500 text-amber-900';
    barColor = 'bg-amber-500';
    badgeBorder = 'border-amber-200 bg-amber-50';
  } else if (percentAvail <= 50) {
    statusColor = 'bg-lime-500 text-lime-900';
    barColor = 'bg-lime-500';
    badgeBorder = 'border-lime-200 bg-lime-50';
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${percentAvail}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-700">
          {availNum}/{totalNum} {unit}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            Cargo Capacity
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeBorder} ${statusColor.split(' ')[1]}`}>
            {availNum === 0 ? 'Fully Booked' : `${availNum} of ${totalNum} ${unit} available`}
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-200">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentAvail}%` }}
        />
      </div>
    </div>
  );
}
