import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Describe the item, origin market, or budget...',
  variant = 'dock',
  autoFocus = false,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = variant === 'empty' ? 160 : 128;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [text, variant]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasText = Boolean(text.trim());
  const isEmpty = variant === 'empty';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full transition-colors bg-white rounded-md border',
        isEmpty
          ? 'border-[#D0CEC6] p-3.5 sm:p-4 focus-within:border-[#465BE6] focus-within:ring-2 focus-within:ring-[#465BE6]/15'
          : 'border-[#E6E5E0] px-3.5 py-2.5 focus-within:border-[#465BE6] focus-within:ring-2 focus-within:ring-[#465BE6]/12'
      )}
    >
      <label htmlFor={`zen-chat-input-${variant}`} className="sr-only">
        Describe what you want to shop for
      </label>

      <textarea
        ref={textareaRef}
        id={`zen-chat-input-${variant}`}
        rows={isEmpty ? 2 : 1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full resize-none bg-transparent text-[#151923] placeholder:text-[#8F94A2] focus:outline-none',
          isEmpty
            ? 'min-h-[54px] text-[15px] leading-relaxed px-0.5'
            : 'min-h-[28px] py-1 text-[14.5px] leading-relaxed'
        )}
      />

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#E6E5E0] pt-2.5">
        <span className="text-[11.5px] text-[#8F94A2] hidden sm:inline">
          Press <kbd className="font-sans font-medium text-[#747987]">Enter</kbd> to submit ·{' '}
          <kbd className="font-sans font-medium text-[#747987]">Shift + Enter</kbd> for new line
        </span>
        <span className="text-[11.5px] text-[#8F94A2] sm:hidden">
          Includes shipping &amp; est. duties
        </span>

        <button
          type="submit"
          disabled={disabled || !hasText}
          aria-label="Send message"
          className={cn(
            'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-[550] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465BE6]',
            isEmpty ? 'h-9 px-4 text-[13px]' : 'h-8 px-3.5 text-[12.5px]',
            hasText && !disabled
              ? 'bg-[#151923] text-white hover:bg-[#465BE6]'
              : 'bg-[#F1EFE9] text-[#8F94A2] cursor-not-allowed'
          )}
        >
          {disabled ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Searching</span>
            </>
          ) : (
            <>
              <span>{isEmpty ? 'Find global offers' : 'Send'}</span>
              <ArrowUp className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
