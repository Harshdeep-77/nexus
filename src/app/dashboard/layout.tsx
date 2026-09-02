import Sidebar from "@/components/layout/Sidebar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 ">{children}</main>
    </div>
  );
}
