import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../utils';

interface SliderContextValue {
  hasError: boolean;
  ariaInvalid?: React.ComponentPropsWithoutRef<
    typeof SliderPrimitive.Root
  >['aria-invalid'];
}

const SliderContext = React.createContext<SliderContextValue>({
  hasError: false,
});

/**
 * Resolves the effective invalid status and normalized aria-invalid value.
 *
 * Rules:
 * 1. If aria-invalid is explicitly false / 'false', the control is NOT invalid,
 *    and error styling must not be applied.
 * 2. If aria-invalid is true / 'true', the control IS invalid and gets semantic error styling.
 * 3. Other explicit values ('grammar', 'spelling') are preserved and treated as invalid.
 * 4. In the absence of an explicit aria-invalid attribute, fallback to the boolean error prop.
 */
function resolveInvalidState(
  ariaInvalid: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>['aria-invalid'],
  error: boolean | string | undefined
): {
  isInvalid: boolean;
  resolvedAriaInvalid: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>['aria-invalid'];
} {
  if (ariaInvalid === false || ariaInvalid === 'false') {
    return { isInvalid: false, resolvedAriaInvalid: 'false' };
  }

  if (ariaInvalid === true || ariaInvalid === 'true') {
    return { isInvalid: true, resolvedAriaInvalid: 'true' };
  }

  if (ariaInvalid === 'grammar' || ariaInvalid === 'spelling') {
    return { isInvalid: true, resolvedAriaInvalid: ariaInvalid };
  }

  if (error) {
    return { isInvalid: true, resolvedAriaInvalid: 'true' };
  }

  return { isInvalid: false, resolvedAriaInvalid: undefined };
}

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  thumbClassName?: string;
  trackClassName?: string;
  rangeClassName?: string;
  thumbAriaLabels?: string[];
  error?: boolean | string;
}

/**
 * Slider Root Component
 * Accessible, production-ready slider component adhering to FeedbackHub design tokens.
 * Supports both single-value and range multi-thumb modes, controlled and uncontrolled.
 */
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      thumbClassName,
      trackClassName,
      rangeClassName,
      thumbAriaLabels,
      error,
      children,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'aria-invalid': customAriaInvalid,
      ...props
    },
    ref
  ) => {
    const { isInvalid: rootIsInvalid, resolvedAriaInvalid: rootResolvedAriaInvalid } =
      resolveInvalidState(customAriaInvalid, error);

    // Determine thumb count for auto-rendered thumbs when children are omitted
    const resolvedValue = props.value ?? props.defaultValue;
    const thumbCount =
      Array.isArray(resolvedValue) && resolvedValue.length > 0
        ? resolvedValue.length
        : 1;

    return (
      <SliderPrimitive.Root
        ref={ref}
        aria-invalid={rootResolvedAriaInvalid}
        className={cn(
          // Base geometry & layout
          'relative flex touch-none select-none items-center',
          'data-[orientation=horizontal]:w-full',
          'data-[orientation=vertical]:h-full data-[orientation=vertical]:flex-col data-[orientation=vertical]:justify-center',
          // Disabled state
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          className
        )}
        {...props}
      >
        <SliderContext.Provider
          value={{
            hasError: rootIsInvalid,
            ariaInvalid: customAriaInvalid,
          }}
        >
          {children ?? (
            <>
              <SliderTrack className={trackClassName}>
                <SliderRange className={rangeClassName} />
              </SliderTrack>
              {Array.from({ length: thumbCount }, (_, index) => {
                const singleLabel =
                  thumbAriaLabels?.[index] ??
                  (thumbCount === 1
                    ? ariaLabel
                    : ariaLabel
                    ? `${ariaLabel} (${index === 0 ? 'minimum' : index === 1 ? 'maximum' : `thumb ${index + 1}`})`
                    : undefined);

                return (
                  <SliderThumb
                    key={index}
                    aria-label={singleLabel}
                    aria-labelledby={thumbCount === 1 ? ariaLabelledby : undefined}
                    aria-describedby={ariaDescribedby}
                    aria-disabled={props.disabled ? 'true' : undefined}
                    className={thumbClassName}
                  />
                );
              })}
            </>
          )}
        </SliderContext.Provider>
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export type SliderTrackProps = React.ComponentPropsWithoutRef<
  typeof SliderPrimitive.Track
>;

/**
 * SliderTrack Component
 * Rounded track container with subtle border token styling.
 */
export const SliderTrack = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Track>,
  SliderTrackProps
>(({ className, ...props }, ref) => {
  return (
    <SliderPrimitive.Track
      ref={ref}
      className={cn(
        'relative grow overflow-hidden rounded-full bg-border transition-smooth',
        'data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2',
        'data-[disabled]:opacity-50',
        className
      )}
      {...props}
    />
  );
});
SliderTrack.displayName = SliderPrimitive.Track.displayName;

export type SliderRangeProps = React.ComponentPropsWithoutRef<
  typeof SliderPrimitive.Range
>;

/**
 * SliderRange Component
 * Filled active segment styled with Primary Purple brand token.
 */
export const SliderRange = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Range>,
  SliderRangeProps
>(({ className, ...props }, ref) => {
  return (
    <SliderPrimitive.Range
      ref={ref}
      className={cn(
        'absolute bg-brand-primary transition-smooth',
        'data-[orientation=horizontal]:h-full',
        'data-[orientation=vertical]:w-full',
        'data-[disabled]:bg-brand-primary/50',
        className
      )}
      {...props}
    />
  );
});
SliderRange.displayName = SliderPrimitive.Range.displayName;

export interface SliderThumbProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Thumb> {
  error?: boolean | string;
}

/**
 * SliderThumb Component
 * Circular knob indicator with smooth transitions and semantic focus ring.
 * Supports error state styling with semantic error tokens.
 */
export const SliderThumb = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Thumb>,
  SliderThumbProps
>(
  (
    {
      className,
      error: thumbError,
      'aria-invalid': thumbAriaInvalid,
      ...props
    },
    ref
  ) => {
    const context = React.useContext(SliderContext);

    const effectiveAriaInvalid =
      thumbAriaInvalid !== undefined ? thumbAriaInvalid : context.ariaInvalid;
    const effectiveError =
      thumbError !== undefined ? thumbError : context.hasError;

    const { isInvalid, resolvedAriaInvalid } = resolveInvalidState(
      effectiveAriaInvalid,
      effectiveError
    );

    return (
      <SliderPrimitive.Thumb
        ref={ref}
        aria-invalid={resolvedAriaInvalid}
        className={cn(
          // Base geometry: 20px circular knob, card surface, soft shadow
          'block h-5 w-5 rounded-full border-2 bg-surface-card shadow-soft-sm transition-smooth cursor-pointer',
          // Normal state vs error state
          isInvalid
            ? 'border-semantic-error focus-visible:ring-semantic-error'
            : 'border-brand-primary focus-visible:ring-brand-primary',
          // Semantic focus ring geometry
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          // Disabled state handling
          'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          isInvalid
            ? 'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:border-semantic-error/50'
            : 'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:border-brand-primary/50',
          className
        )}
        {...props}
      />
    );
  }
);
SliderThumb.displayName = SliderPrimitive.Thumb.displayName;

export interface SliderLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  disabled?: boolean;
}

/**
 * SliderLabel Component
 * Accessible label associated with a Slider primitive.
 */
export const SliderLabel = React.forwardRef<
  HTMLLabelElement,
  SliderLabelProps
>(({ className, disabled, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-content-main select-none cursor-pointer leading-none',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    />
  );
});
SliderLabel.displayName = 'SliderLabel';

export type SliderDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * SliderDescription Component
 * Accessible helper/description text associated with a Slider primitive.
 */
export const SliderDescription = React.forwardRef<
  HTMLParagraphElement,
  SliderDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-xs text-content-secondary', className)}
      {...props}
    />
  );
});
SliderDescription.displayName = 'SliderDescription';
