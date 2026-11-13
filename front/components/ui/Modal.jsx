import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Usa <dialog> nativo: foco atrapado y cierre con Esc sin código extra.
export default function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}
      data-testid="modal" className="w-full max-w-lg rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/50">
      {open && (
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
