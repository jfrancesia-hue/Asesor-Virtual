export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="next3d-body relative min-h-screen overflow-hidden px-4 py-10">
      <div className="next3d-aurora" aria-hidden="true" />
      <div className="next3d-grid opacity-45" aria-hidden="true" />
      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
