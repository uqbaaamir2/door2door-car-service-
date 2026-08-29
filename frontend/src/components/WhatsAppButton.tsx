import { MessageCircle } from "lucide-react";

const whatsappNumber = import.meta.env["VITE_MOTORMATE_WHATSAPP_NUMBER"] ||
  "REPLACE_WITH_BUSINESS_WHATSAPP_NUMBER";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Hello MotorMate, I would like to know more about your car services.",
)}`;

export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      title="Chat with us on WhatsApp"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-24 right-6 z-[55] grid size-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] max-sm:bottom-24 max-sm:right-4"
    >
      <MessageCircle className="size-6" aria-hidden="true" />
    </a>
  );
}