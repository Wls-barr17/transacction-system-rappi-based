import { Star } from 'lucide-react';

export default function StarRating({ label, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-800">{label}</legend>
      <div role="radiogroup" aria-label={label} className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} de 5 estrellas`}
            onClick={() => onChange(n)} className="rounded p-1" data-testid={`star-${n}`}>
            <Star className={`h-7 w-7 ${n <= value ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} aria-hidden="true" />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
