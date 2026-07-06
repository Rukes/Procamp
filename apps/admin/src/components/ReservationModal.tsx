import { useEffect } from "react";
import { ReservationDetailContent } from "../pages/ReservationDetail";

interface Props {
  reservationId: string | null;
  onClose: () => void;
  onChanged?: () => void;
}

export default function ReservationModal({ reservationId, onClose, onChanged }: Props) {
  useEffect(() => {
    if (!reservationId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reservationId, onClose]);

  if (!reservationId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-5xl mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <ReservationDetailContent id={reservationId} onClose={onClose} onChanged={onChanged} />
      </div>
    </div>
  );
}
