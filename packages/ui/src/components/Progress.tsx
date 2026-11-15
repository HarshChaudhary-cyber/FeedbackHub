import * as React from 'react';
import { cn } from '../utils';

// -----------------------------------------------------------------------------
// Progress Types & Styles
// -----------------------------------------------------------------------------

export type ProgressVariant = 'default' | 'success' | 'warning' | 'error';
export type ProgressSize = 'sm' | 'md' | 'lg';

const progressVariantStyles: Record<ProgressVariant, string> = {
  default: 'bg-brand-primary',
  success: 'bg-semantic-success',
  warning: 'bg-semantic-warning',
  error: 'bg-semantic-error',
};

const progressSizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

// -----------------------------------------------------------------------------
// ProgressIndicator Component
// -----------------------------------------------------------------------------

export interface ProgressIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant for indicator bar */
  variant?: ProgressVariant;
  /** Whether the progress is in an indeterminate state */
  isIndeterminate?: boolean;
  /** Progress percentage between 0 and 100 */
  percentage?: number;
  /** Optional custom class for the indicator element */
  indicatorClassName?: string;
}

/**
 * ProgressIndicator Component
 * Inner bar rendering the fill width and animations according to progress state.
 */
export const ProgressIndicator = React.forwardRef<
  HTMLDivElement,
  ProgressIndicatorProps
>(
  (
    {
      variant = 'default',
      isIndeterminate = false,
      percentage = 0,
      className,
      indicatorClassName,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-state={
          isIndeterminate
            ? 'indeterminate'
            : percentage === 100
            ? 'complete'
            : 'loading'
        }
        style={
          isIndeterminate
            ? style
            : { width: `${percentage}%`, ...style }
        }
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-in-out motion-reduce:transition-none',
          progressVariantStyles[variant] || progressVariantStyles.default,
          isIndeterminate &&
            'w-full animate-pulse opacity-75 motion-reduce:animate-none',
          indicatorClassName,
          className
        )}
        {...props}
      />
    );
  }
);
ProgressIndicator.displayName = 'ProgressIndicator';

// -----------------------------------------------------------------------------
// Progress Component
// -----------------------------------------------------------------------------

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'label'> {
  /**
   * Current progress value.
   * If null or undefined, the progress bar enters an indeterminate state.
   */
  value?: number | null;
  /**
   * Maximum progress value. Defaults to 100.
   */
  max?: number;
  /**
   * Visual variant representing progress intent.
   * Defaults to 'default'.
   */
  variant?: ProgressVariant;
  /**
   * Size/height of the progress bar track.
   * Defaults to 'md'.
   */
  size?: ProgressSize;
  /**
   * Optional visible label rendered above the progress track.
   */
  label?: React.ReactNode;
  /**
   * Whether to display the percentage value text (e.g. "45%").
   */
  showValue?: boolean;
  /**
   * Optional custom formatted text for the value display and aria-valuetext.
   * E.g. (val, max) => `Step ${val} of ${max}`
   */
  getValueText?: (value: number, max: number) => string;
  /**
   * Optional custom class for the outer wrapper when label or showValue is present.
   */
  wrapperClassName?: string;
  /**
   * Optional custom class for the inner indicator element.
   */
  indicatorClassName?: string;
}

/**
 * Progress Component
 * Reusable, accessible indicator for surveys, file uploads, onboarding flows,
 * and background operations. Supports determinate, indeterminate, and custom formatted states.
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max: rawMax = 100,
      variant = 'default',
      size = 'md',
      label,
      showValue = false,
      getValueText,
      className,
      wrapperClassName,
      indicatorClassName,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      id: customId,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for linking visible label with aria-labelledby if needed
    const generatedId = React.useId();
    const id = customId || generatedId;
    const labelId = label ? `${id}-label` : undefined;
    const valueTextId = showValue ? `${id}-value` : undefined;

    // Validate max: must be a positive number greater than 0
    const max =
      typeof rawMax === 'number' && rawMax > 0 && !isNaN(rawMax) ? rawMax : 100;

    // Determine if progress is in indeterminate state
    const isIndeterminate =
      value === null || value === undefined || (typeof value === 'number' && isNaN(value));

    // Clamp numeric value between 0 and max
    const clampedValue = isIndeterminate
      ? 0
      : Math.min(Math.max(0, value), max);

    // Calculate percentage (0 to 100)
    const percentage = isIndeterminate
      ? 0
      : Math.round((clampedValue / max) * 100);

    // Human-readable value text
    const valueText = isIndeterminate
      ? undefined
      : getValueText
      ? getValueText(clampedValue, max)
      : `${percentage}%`;

    // Accessible name resolution
    const resolvedAriaLabel =
      ariaLabel ??
      (!ariaLabelledBy && typeof label === 'string' ? label : undefined);
    const resolvedAriaLabelledBy =
      ariaLabelledBy ??
      (!ariaLabel && label && typeof label !== 'string' ? labelId : undefined);

    const hasHeader = Boolean(label || showValue);

    const track = (
      <div
        ref={ref}
        id={id}
        role="progressbar"
        aria-valuemin={isIndeterminate ? undefined : 0}
        aria-valuemax={isIndeterminate ? undefined : max}
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-valuetext={valueText}
        aria-label={resolvedAriaLabel}
        aria-labelledby={resolvedAriaLabelledBy}
        data-state={
          isIndeterminate
            ? 'indeterminate'
            : clampedValue === max
            ? 'complete'
            : 'loading'
        }
        data-value={isIndeterminate ? undefined : clampedValue}
        data-max={max}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-border/40 transition-smooth',
          progressSizeStyles[size] || progressSizeStyles.md,
          className
        )}
        {...props}
      >
        <ProgressIndicator
          variant={variant}
          isIndeterminate={isIndeterminate}
          percentage={percentage}
          indicatorClassName={indicatorClassName}
        />
      </div>
    );

    if (!hasHeader) {
      return track;
    }

    return (
      <div className={cn('w-full space-y-1.5', wrapperClassName)}>
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-content-main leading-none">
          {label && (
            <span id={labelId} className="truncate">
              {label}
            </span>
          )}
          {showValue && !isIndeterminate && (
            <span
              id={valueTextId}
              className="text-content-secondary tabular-nums ml-auto pl-2"
              aria-hidden="true"
            >
              {valueText}
            </span>
          )}
        </div>
        {track}
      </div>
    );
  }
);
Progress.displayName = 'Progress';
