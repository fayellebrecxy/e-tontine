export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface-container-low text-on-surface flex flex-col font-sans">
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
