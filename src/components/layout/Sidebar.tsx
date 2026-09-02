export default function Sidebar() {
  return (
    <div className="flex flex-col w-64 h-screen   bg-[#0F1629] text-white">
      {/* Logo */}
      <div
        className="flex items-center justify-between px-5 py-5 border-b"
        style={{ borderColor: "#1E2D4A" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7L5.5 10.5L12 3.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            className="text-white font-semibold text-[15px] tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Nexus
          </span>
        </div>
        <button
          //   onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 2L14 14M14 2L2 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <ul className="flex flex-col space-y-2 p-4">
        <li className="hover:bg-gray-700 p-2 rounded cursor-pointer">
          Dashboard
        </li>
        <li className="hover:bg-gray-700 p-2 rounded cursor-pointer">
          Settings
        </li>
        <li className="hover:bg-gray-700 p-2 rounded cursor-pointer">
          Profile
        </li>
        <li className="hover:bg-gray-700 p-2 rounded cursor-pointer">Logout</li>
      </ul>
    </div>
  );
}
