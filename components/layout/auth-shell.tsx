import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex h-10 max-w-md items-center">
          <Link href="/" className="text-base font-semibold text-gray-900 dark:text-white">
            E-Tontine
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
    </div>
  );
}
