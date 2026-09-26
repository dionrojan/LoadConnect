import React from 'react';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';

const STAGES = [
  { key: 'requested', label: 'Requested', desc: 'Awaiting driver approval', icon: Clock },
  { key: 'accepted', label: 'Accepted', desc: 'Space reserved & confirmed', icon: CheckCircle2 },
  { key: 'picked_up', label: 'Picked Up', desc: 'Loaded & in transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Arrived at destination', icon: PackageCheck },
];

export default function StatusStepper({ currentStatus = 'requested', compact = false, orientation = 'vertical' }) {
  const isDeclined = currentStatus === 'declined';

  const getStageIndex = (status) => {
    switch (status) {
      case 'requested': return 0;
      case 'accepted': return 1;
      case 'picked_up': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  if (isDeclined) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
        <AlertCircle className="w-4 h-4 text-rose-500" />
        <span>Booking Declined / Withdrawn</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {STAGES.map((st, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <React.Fragment key={st.key}>
              <div
                title={`${st.label}: ${st.desc}`}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-amber-500 ring-4 ring-amber-100 scale-110'
                    : isDone
                    ? 'bg-emerald-600'
                    : 'bg-slate-200'
                }`}
              />
              {idx < STAGES.length - 1 && (
                <div className={`w-3 h-0.5 ${idx < currentIndex ? 'bg-emerald-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  if (orientation === 'horizontal') {
    return (
      <div className="w-full py-2">
        <div className="relative flex items-center justify-between">
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-forest-600 -z-0 transition-all duration-500"
            style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
          />

          {STAGES.map((st, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const Icon = st.icon;

            return (
              <div key={st.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCurrent
                      ? 'bg-amber-500 border-white text-white shadow-md ring-4 ring-amber-100 scale-110'
                      : isDone
                      ? 'bg-forest-700 border-white text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 ${isCurrent ? 'text-amber-700' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Canonical Vertical Stop Timeline from Reference 2 Detail Panel
  return (
    <div className="relative pl-6 space-y-4">
      {/* Connecting vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
      <div
        className="absolute left-[11px] top-2 w-0.5 bg-forest-600 transition-all duration-500"
        style={{
          height: `${Math.min(100, (currentIndex / (STAGES.length - 1)) * 100)}%`
        }}
      />

      {STAGES.map((st, idx) => {
        const isDone = idx <= currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={st.key} className="relative flex items-start gap-3 group">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 mt-1 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                isCurrent
                  ? 'bg-amber-500 border-white ring-4 ring-amber-100 scale-110'
                  : isDone
                  ? 'bg-forest-700 border-white ring-2 ring-forest-100'
                  : 'bg-slate-300 border-white'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isCurrent ? 'text-forest-800' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                  {st.label}
                </span>
                {isCurrent && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{st.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
