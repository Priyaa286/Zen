export function TypingIndicator() {
  return (
    <div
      className="flex flex-col gap-2 py-2"
      role="status"
      aria-live="polite"
      aria-label="Checking prices and delivery options"
    >
      <span className="text-[11.5px] font-medium text-[#747987]">
        Checking prices and delivery options...
      </span>

      <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#E6E5E0] bg-white px-4 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-[#465BE6] animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#465BE6] animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#465BE6] animate-bounce" />
      </div>
    </div>
  );
}
