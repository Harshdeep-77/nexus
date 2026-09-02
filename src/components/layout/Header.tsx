"use client";

type HeaderProps = {
  /** Opens the sliding sidebar. Mobile only — the button is hidden on desktop. */
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="-ml-1.5 rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span
          className="text-gray-700 font-semibold text-[15px] tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Nexus
        </span>
      </div>
    </header>
  );
}
