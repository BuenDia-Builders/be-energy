"use client"

interface StatusBadgeProps {
  status: "completed" | "pending" | "failed"
  className?: string
}

const statusConfig = {
  completed: {
    label: "Completed",
    className: "v2-status-completed",
  },
  pending: {
    label: "Pending",
    className: "v2-status-pending",
  },
  failed: {
    label: "Failed",
    className: "v2-status-failed",
  },
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: "currentColor" }}
      />
      {config.label}
    </span>
  )
}
