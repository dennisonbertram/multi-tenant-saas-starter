import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <Link href="/" className="text-lg font-semibold">
          SaaS Starter
        </Link>
      </div>
      {children}
    </main>
  );
}
