export default function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)} data-testid="switch"
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${checked ? 'bg-green-700' : 'bg-slate-500'}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${checked ? 'left-[1.4rem]' : 'left-0.5'}`} />
    </button>
  );
}
