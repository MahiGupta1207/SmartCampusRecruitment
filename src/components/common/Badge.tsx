import React from 'react';
import { cn } from '../../lib/utils';
import { ApplicationStatus, OfferStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ApplicationStatus | string; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'Applied':
      return <Badge variant="info" className={className}>Applied</Badge>;
    case 'Under Review':
      return <Badge variant="warning" className={className}>Under Review</Badge>;
    case 'Shortlisted':
      return <Badge variant="primary" className={className}>Shortlisted</Badge>;
    case 'Interview Scheduled':
      return <Badge variant="warning" className={cn("border-amber-400 bg-amber-100 text-amber-900 font-bold", className)}>Interview Scheduled</Badge>;
    case 'Selected':
      return <Badge variant="success" className={cn("border-emerald-400 bg-emerald-100 text-emerald-900 font-bold", className)}>Selected 🎉</Badge>;
    case 'Rejected':
      return <Badge variant="danger" className={className}>Not Shortlisted</Badge>;
    default:
      return <Badge variant="default" className={className}>{status}</Badge>;
  }
};

export const OfferStatusBadge: React.FC<{ status: OfferStatus | string; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'Pending':
      return <Badge variant="warning" className={cn('font-bold', className)}>Offer: Pending</Badge>;
    case 'Accepted':
      return <Badge variant="success" className={cn('border-emerald-400 bg-emerald-100 text-emerald-900 font-bold', className)}>Offer: Accepted</Badge>;
    case 'Declined':
      return <Badge variant="danger" className={cn('font-bold', className)}>Offer: Declined</Badge>;
    default:
      return <Badge variant="default" className={className}>{status}</Badge>;
  }
};
