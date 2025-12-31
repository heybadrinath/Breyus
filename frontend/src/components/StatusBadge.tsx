import React from 'react';
import { CheckCircle, XCircle, Clock, ArrowRightLeft, MessageCircle } from 'lucide-react';

export type StatusType =
  | 'verified'
  | 'received'
  | 'pending'
  | 'rejected'
  | 'cancelled'
  | 'countered'
  | 'buyer_responded'
  | 'accepted'
  | 'completed'
  | 'in_progress'
  | 'processing';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  showDot?: boolean;
  showIcon?: boolean;
  customLabel?: string;
}

const statusConfig: Record<StatusType, {
  bgColor: string;
  textColor: string;
  dotColor: string;
  label: string;
  icon?: React.ReactNode;
}> = {
  verified: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
    label: 'Verified',
    icon: <CheckCircle className="w-3 h-3" />
  },
  received: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
    label: 'Received',
    icon: <CheckCircle className="w-3 h-3" />
  },
  accepted: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
    label: 'Accepted',
    icon: <CheckCircle className="w-3 h-3" />
  },
  completed: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
    label: 'Completed',
    icon: <CheckCircle className="w-3 h-3" />
  },
  pending: {
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    dotColor: 'bg-yellow-500',
    label: 'Pending',
    icon: <Clock className="w-3 h-3" />
  },
  rejected: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
    label: 'Rejected',
    icon: <XCircle className="w-3 h-3" />
  },
  cancelled: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
    label: 'PO Cancelled',
    icon: <XCircle className="w-3 h-3" />
  },
  countered: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
    label: 'Countered',
    icon: <ArrowRightLeft className="w-3 h-3" />
  },
  buyer_responded: {
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    dotColor: 'bg-purple-500',
    label: 'Buyer Responded',
    icon: <MessageCircle className="w-3 h-3" />
  },
  in_progress: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
    label: 'In Progress',
    icon: <Clock className="w-3 h-3" />
  },
  processing: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
    label: 'Processing',
    icon: <Clock className="w-3 h-3" />
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showDot = false,
  showIcon = false,
  customLabel
}) => {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';
  const label = customLabel || config.label;

  if (showDot) {
    return (
      <span className={`flex items-center gap-1.5 ${config.textColor} ${sizeClasses} font-medium`}>
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
        {label}
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 ${config.bgColor} ${config.textColor} ${sizeClasses} rounded-full font-medium`}>
      {showIcon && config.icon}
      {label}
    </span>
  );
};

// Helper function to convert trade status to StatusType
export const getTradeStatusType = (trade: {
  negotiationStatus?: string;
  purchaseRequestStatus?: string;
  purchaseOrderStatus?: string;
  tradePhase?: string;
}): StatusType => {
  // Check for completed trades
  if (trade.tradePhase === 'COMPLETED') {
    return 'completed';
  }

  // Check negotiation status
  if (trade.negotiationStatus === 'accepted' || trade.purchaseRequestStatus === 'accepted') {
    return 'accepted';
  }
  if (trade.negotiationStatus === 'rejected' || trade.purchaseRequestStatus === 'rejected') {
    return 'rejected';
  }
  if (trade.negotiationStatus === 'countered') {
    return 'countered';
  }
  if (trade.negotiationStatus === 'buyer_responded') {
    return 'buyer_responded';
  }

  // Check purchase order status
  if (trade.purchaseOrderStatus === 'confirmed') {
    return 'received';
  }
  if (trade.purchaseOrderStatus === 'cancelled') {
    return 'cancelled';
  }
  if (trade.purchaseOrderStatus === 'processing') {
    return 'processing';
  }

  return 'pending';
};

export default StatusBadge;
