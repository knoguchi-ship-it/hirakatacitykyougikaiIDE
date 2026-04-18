import React, { useMemo, useRef } from 'react';

type PostalCodeInputProps = {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  inputClassName: string;
  wrapperClassName?: string;
  firstInputLabel?: string;
  secondInputLabel?: string;
};

const extractDigits = (value: string) => String(value || '').replace(/\D/g, '').slice(0, 7);

const formatPostalCode = (first: string, second: string) => {
  if (!first && !second) return '';
  if (first && !second) return `${first}-`;
  if (!first && second) return second;
  return `${first}-${second}`;
};

const splitPostalCode = (value: string) => {
  const digits = extractDigits(value);
  return {
    first: digits.slice(0, 3),
    second: digits.slice(3, 7),
  };
};

const PostalCodeInput: React.FC<PostalCodeInputProps> = ({
  id,
  value,
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  required = false,
  invalid = false,
  describedBy,
  inputClassName,
  wrapperClassName = 'flex items-center gap-2',
  firstInputLabel = '郵便番号 上3桁',
  secondInputLabel = '郵便番号 下4桁',
}) => {
  const secondInputRef = useRef<HTMLInputElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const parts = useMemo(() => splitPostalCode(value), [value]);
  const firstId = id || undefined;
  const secondId = id ? `${id}-suffix` : undefined;

  const handleFirstChange = (nextRaw: string) => {
    const digits = extractDigits(nextRaw);
    const nextFirst = digits.slice(0, 3);
    const nextSecond = digits.slice(3, 7) || parts.second;
    onChange(formatPostalCode(nextFirst, nextSecond));
    if (digits.length >= 3) {
      window.requestAnimationFrame(() => secondInputRef.current?.focus());
    }
  };

  const handleSecondChange = (nextRaw: string) => {
    const digits = extractDigits(nextRaw);
    if (digits.length > 4) {
      const merged = extractDigits(`${parts.first}${digits}`);
      onChange(formatPostalCode(merged.slice(0, 3), merged.slice(3, 7)));
      return;
    }
    onChange(formatPostalCode(parts.first, digits));
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    const digits = extractDigits(pasted);
    if (!digits) return;
    event.preventDefault();
    onChange(formatPostalCode(digits.slice(0, 3), digits.slice(3, 7)));
    if (digits.length >= 3) {
      window.requestAnimationFrame(() => {
        if (digits.length >= 7) return;
        secondInputRef.current?.focus();
      });
    }
  };

  const handleSecondKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !parts.second) {
      window.requestAnimationFrame(() => firstInputRef.current?.focus());
    }
  };

  return (
    <div className={wrapperClassName}>
      <div className="w-24">
        <input
          ref={firstInputRef}
          id={firstId}
          type="text"
          value={parts.first}
          onChange={(event) => handleFirstChange(event.target.value)}
          onBlur={onBlur}
          onPaste={handlePaste}
          disabled={disabled}
          readOnly={readOnly}
          inputMode="numeric"
          autoComplete="postal-code"
          aria-label={firstInputLabel}
          aria-required={required}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={inputClassName}
          placeholder="123"
        />
      </div>
      <span className="text-slate-400" aria-hidden="true">-</span>
      <div className="w-28">
        <input
          ref={secondInputRef}
          id={secondId}
          type="text"
          value={parts.second}
          onChange={(event) => handleSecondChange(event.target.value)}
          onBlur={onBlur}
          onPaste={handlePaste}
          onKeyDown={handleSecondKeyDown}
          disabled={disabled}
          readOnly={readOnly}
          inputMode="numeric"
          autoComplete="off"
          aria-label={secondInputLabel}
          aria-required={required}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={inputClassName}
          placeholder="4567"
        />
      </div>
    </div>
  );
};

export default PostalCodeInput;
