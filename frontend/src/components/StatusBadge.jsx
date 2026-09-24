import React from 'react';
import { Clock, CheckCircle2, CheckCheck, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const configs = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    confirmed: {
      label: 'Confirmed',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: CheckCircle2,
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCheck,
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
    },
  };

  const current = configs[status] || configs.pending;
  const IconComponent = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
};

export default StatusBadge;
