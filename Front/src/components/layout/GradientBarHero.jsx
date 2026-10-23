// Inspirado en "gradient-bar-hero-section" de 21st.dev
export default function GradientBarHero({ children }) {
  const N = 23;
  const bars = Array.from({ length: N }, (_, i) => {
    const d = Math.abs(i - (N - 1) / 2) / ((N - 1) / 2);
    return 18 + d * d * 72;
  });
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white" data-testid="hero">
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 flex h-full items-end gap-1 px-1">
        {bars.map((h, i) => <div key={i} className="hero-bar flex-1" style={{ height: `${h}%`, animationDelay: `${(i % 7) * 0.35}s` }} />)}
      </div>
      <div className="mx-auto flex min-h-[34rem] max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">{children}</div>
    </section>
  );
}
