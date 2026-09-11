import AuthShowcase from "@/components/auth/AuthShowcase";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full bg-white lg:grid-cols-2">
      {/* left: looping product animation */}
      <div className="relative hidden lg:block">
        <AuthShowcase />
      </div>

      {/* right: the form */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
