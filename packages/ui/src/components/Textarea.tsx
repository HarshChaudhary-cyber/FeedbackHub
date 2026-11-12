import React, { forwardRef, useId } from 'react';
import { cn } from '../utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  success?: boolean;
  wrapperClassName?: string;
  resizable?: boolean | 'y' | 'x' | 'both' | 'none';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id: customId,
      name,
      label,
      helperText,
      error,
      success,
      disabled,
      readOnly,
      required,
      rows = 4,
      resizable = 'y',
      className,
      wrapperClassName,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = customId || (name ? `textarea-${name}` : `textarea-${generatedId}`);
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const isShowingError = hasError && Boolean(errorMessage);
    const isShowingHelper = Boolean(helperText) && !isShowingError;

    // Accessible described-by linking only for elements actually rendered in the DOM
    const describedByList: string[] = [];
    if (ariaDescribedBy) describedByList.push(ariaDescribedBy);
    if (isShowingError) describedByList.push(errorId);
    if (isShowingHelper) describedByList.push(helperId);
    const resolvedDescribedBy =
      describedByList.length > 0 ? describedByList.join(' ') : undefined;

    const resizeClass =
      resizable === false || resizable === 'none'
        ? 'resize-none'
        : resizable === 'x'
        ? 'resize-x'
        : resizable === 'both' || resizable === true
        ? 'resize'
        : 'resize-y';

    return (
      <div className={cn('w-full flex flex-col space-y-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-content-main select-none flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-semantic-error" aria-hidden="true">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={resolvedDescribedBy}
          className={cn(
            // Strict 14px rounded corners (rounded-input / rounded-[14px])
            'w-full rounded-[14px] bg-surface-card text-content-main placeholder:text-content-muted border px-3.5 py-2.5 text-sm transition-smooth font-normal shadow-soft-sm leading-relaxed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            resizeClass,
            // Border and focus ring states
            hasError
              ? 'border-semantic-error focus-visible:ring-semantic-error text-semantic-error'
              : success
              ? 'border-semantic-success focus-visible:ring-semantic-success'
              : 'border-border hover:border-slate-300 focus-visible:ring-brand-primary',
            // Disabled and read-only styling
            disabled && 'bg-slate-50 text-content-muted border-slate-200 cursor-not-allowed opacity-75',
            readOnly && 'bg-slate-50 cursor-default',
            className
          )}
          {...props}
        />

        {/* Error message takes visual priority */}
        {isShowingError ? (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-semantic-error flex items-center gap-1 mt-0.5"
          >
            <span>{errorMessage}</span>
          </p>
        ) : isShowingHelper ? (
          <p
            id={helperId}
            className="text-xs text-content-secondary mt-0.5"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
