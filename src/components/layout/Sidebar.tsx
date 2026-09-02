"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Tasks", href: "/dashboard/tasks" },
  { name: "Profile", href: "/profile" },
  { name: "Logout", href: "/logout" },
];

type SidebarProps = {
  /** Mobile only: whether the sliding panel is open. Desktop is always visible. */
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // While the mobile panel is open, Escape closes it and the page behind it stays put.
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <>
      {/* backdrop behind the sliding panel */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-[#0F1629] text-white transition-transform duration-300 ease-out md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
            onClick={onClose}
            aria-label="Close menu"
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
          {navItems.map((item) => (
            <li
              key={item.name}
              onClick={() => navigate(item.href)}
              className={`p-2 rounded cursor-pointer ${
                pathname === item.href ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
