export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="app" style={{ position: 'relative', zIndex: 1, height: '100dvh', width: '100vw', display: 'flex' }}>
      {children}
    </div>
  );
}
