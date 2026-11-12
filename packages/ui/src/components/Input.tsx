import React, { forwardRef, useId } from 'react';
import { cn } from '../utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const inputSizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 text-xs px-3',
  md: 'h-10 text-sm px-3.5',
  lg: 'h-12 text-base px-4',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: customId,
      name,
      type = 'text',
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      disabled,
      readOnly,
      required,
      className,
      wrapperClassName,
      size = 'md',
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || (name ? `input-${name}` : `input-${generatedId}`);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const isShowingError = hasError && Boolean(errorMessage);
    const isShowingHelper = Boolean(helperText) && !isShowingError;

    // Build accessible describedby string only for elements actually rendered in the DOM
    const describedByList: string[] = [];
    if (ariaDescribedBy) describedByList.push(ariaDescribedBy);
    if (isShowingError) describedByList.push(errorId);
    if (isShowingHelper) describedByList.push(helperId);
    const resolvedDescribedBy =
      describedByList.length > 0 ? describedByList.join(' ') : undefined;

    return (
      <div className={cn('w-full flex flex-col space-y-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-content-main select-none flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-semantic-error" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-content-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={resolvedDescribedBy}
            className={cn(
              // Strict 14px rounded corners (rounded-input / rounded-[14px])
              'w-full rounded-[14px] bg-surface-card text-content-main placeholder:text-content-muted border transition-smooth font-normal shadow-soft-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              inputSizeStyles[size],
              // Border and focus ring states
              hasError
                ? 'border-semantic-error focus-visible:ring-semantic-error text-semantic-error'
                : success
                ? 'border-semantic-success focus-visible:ring-semantic-success'
                : 'border-border hover:border-slate-300 focus-visible:ring-brand-primary',
              // Padding adjustments when icons are present
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              // Disabled and read-only styling
              disabled && 'bg-slate-50 text-content-muted border-slate-200 cursor-not-allowed opacity-75',
              readOnly && 'bg-slate-50 cursor-default',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-content-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message takes visual priority over helper text */}
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

Input.displayName = 'Input';
