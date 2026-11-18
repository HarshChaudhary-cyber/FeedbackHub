import * as React from 'react';
import { cn } from '../utils';
import { Label, type LabelProps } from './Label';

// -----------------------------------------------------------------------------
// Form Field Context
// -----------------------------------------------------------------------------

export interface FormFieldContextValue {
  id: string;
  name?: string;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  hasError: boolean;
  error?: string | boolean;
  isDescribedByDescription: boolean;
  isDescribedByMessage: boolean;
  setIsDescribedByDescription: (val: boolean) => void;
  setIsDescribedByMessage: (val: boolean) => void;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function useFormField(): FormFieldContextValue {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a <FormField>');
  }
  return context;
}

// -----------------------------------------------------------------------------
// FormField Provider
// -----------------------------------------------------------------------------

export interface FormFieldProps {
  /** Optional custom base ID for the field */
  id?: string;
  /** Field name identifier */
  name?: string;
  /** Error message string or boolean flag */
  error?: string | boolean;
  children: React.ReactNode;
}

/**
 * FormField Component
 * Context provider that generates coordinated accessible IDs and state for form controls,
 * labels, descriptions, and error messages.
 */
export const FormField: React.FC<FormFieldProps> = ({
  id: customId,
  name,
  error,
  children,
}) => {
  const generatedId = React.useId();
  const id = customId || (name ? `field-${name}` : `field-${generatedId}`);
  const formItemId = `${id}-item`;
  const formDescriptionId = `${id}-description`;
  const formMessageId = `${id}-message`;

  const [isDescribedByDescription, setIsDescribedByDescription] = React.useState(false);
  const [isDescribedByMessage, setIsDescribedByMessage] = React.useState(false);

  const hasError = Boolean(error);

  const value = React.useMemo<FormFieldContextValue>(
    () => ({
      id,
      name,
      formItemId,
      formDescriptionId,
      formMessageId,
      hasError,
      error,
      isDescribedByDescription,
      isDescribedByMessage,
      setIsDescribedByDescription,
      setIsDescribedByMessage,
    }),
    [
      id,
      name,
      formItemId,
      formDescriptionId,
      formMessageId,
      hasError,
      error,
      isDescribedByDescription,
      isDescribedByMessage,
    ]
  );

  return (
    <FormFieldContext.Provider value={value}>
      {children}
    </FormFieldContext.Provider>
  );
};

FormField.displayName = 'FormField';

// -----------------------------------------------------------------------------
// FormItem
// -----------------------------------------------------------------------------

export type FormItemProps = React.HTMLAttributes<HTMLDivElement>;

export const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-1.5 w-full flex flex-col', className)}
        {...props}
      />
    );
  }
);
FormItem.displayName = 'FormItem';

// -----------------------------------------------------------------------------
// FormLabel
// -----------------------------------------------------------------------------

export interface FormLabelProps extends LabelProps {
  /** Whether to show error styling on the label when field has error */
  indicateError?: boolean;
}

export const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FormLabelProps
>(({ className, indicateError = false, ...props }, ref) => {
  const { formItemId, hasError } = useFormField();

  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      className={cn(
        indicateError && hasError && 'text-semantic-error',
        className
      )}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

// -----------------------------------------------------------------------------
// FormControl
// -----------------------------------------------------------------------------

export interface FormControlProps
  extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactElement<Record<string, unknown>>;
}

export const FormControl = React.forwardRef<HTMLElement, FormControlProps>(
  ({ children, ...props }, ref) => {
    const {
      formItemId,
      formDescriptionId,
      formMessageId,
      hasError,
      isDescribedByDescription,
      isDescribedByMessage,
    } = useFormField();

    const describedByList: string[] = [];
    if (isDescribedByDescription) describedByList.push(formDescriptionId);
    if (isDescribedByMessage && hasError) describedByList.push(formMessageId);

    const existingDescribedBy = children.props['aria-describedby'] as string | undefined;
    if (existingDescribedBy) {
      describedByList.unshift(existingDescribedBy);
    }

    const ariaDescribedBy =
      describedByList.length > 0 ? describedByList.join(' ') : undefined;

    return React.cloneElement(children, {
      id: children.props.id || formItemId,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': hasError ? 'true' : undefined,
      ref,
      ...props,
    });
  }
);
FormControl.displayName = 'FormControl';

// -----------------------------------------------------------------------------
// FormDescription
// -----------------------------------------------------------------------------

export type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, id: customId, ...props }, ref) => {
  const { formDescriptionId, setIsDescribedByDescription } = useFormField();

  React.useEffect(() => {
    setIsDescribedByDescription(true);
    return () => setIsDescribedByDescription(false);
  }, [setIsDescribedByDescription]);

  return (
    <p
      ref={ref}
      id={customId || formDescriptionId}
      className={cn('text-xs text-content-secondary leading-normal', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

// -----------------------------------------------------------------------------
// FormMessage
// -----------------------------------------------------------------------------

export type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement>;

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  FormMessageProps
>(({ className, children, id: customId, ...props }, ref) => {
  const { formMessageId, hasError, error, setIsDescribedByMessage } = useFormField();

  const message = children || (typeof error === 'string' ? error : null);

  React.useEffect(() => {
    if (hasError && message) {
      setIsDescribedByMessage(true);
      return () => setIsDescribedByMessage(false);
    }
  }, [hasError, message, setIsDescribedByMessage]);

  if (!hasError || !message) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={customId || formMessageId}
      role="alert"
      aria-live="polite"
      className={cn('text-xs font-medium text-semantic-error leading-normal', className)}
      {...props}
    >
      {message}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';
