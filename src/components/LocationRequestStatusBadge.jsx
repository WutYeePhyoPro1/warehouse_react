const STATUS_CONFIG = {
  request: {
    label: "Request",
    wrap: "border-amber-200 bg-amber-50 text-amber-800",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  completed: {
    label: "Completed",
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  cancel: {
    label: "Cancel",
    wrap: "border-rose-200 bg-rose-50 text-rose-800",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
};

export default function LocationRequestStatusBadge({ status }) {
  const normalized = String(status).toLowerCase();
  const config = STATUS_CONFIG[normalized] ?? {
    label: status,
    wrap: "border-gray-200 bg-gray-50 text-gray-700",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
      />
    ),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm ${config.wrap}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        className="size-3.5 shrink-0"
      >
        {config.icon}
      </svg>
      <span>{config.label}</span>
    </span>
  );
}
