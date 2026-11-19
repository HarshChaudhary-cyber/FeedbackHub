import * as React from 'react';
import { cn } from '../utils';
import { Label, type LabelProps } from './Label';

// -----------------------------------------------------------------------------
// Form Field Contexts
// -----------------------------------------------------------------------------

export interface FormFieldContextValue {
  id: string;
  name?: string;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  hasError: boolean;
  error?: string | boolean | React.ReactNode;
  isDescribedByDescription?: boolean;
  isDescribedByMessage?: boolean;
  setIsDescribedByDescription?: (val: boolean) => void;
  setIsDescribedByMessage?: (val: boolean) => void;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

interface FormItemContextValue {
  id: string;
  controlId: string;
  descriptionId?: string;
  messageId?: string;
  hasError: boolean;
  error?: string | boolean | React.ReactNode;
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

/**
 * Hook to access coordinated form field identifiers and validation state.
 */
export function useFormField(): FormFieldContextValue {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  if (!fieldContext && !itemContext) {
    throw new Error('useFormField must be used within a <FormField>');
  }

  const baseId = itemContext?.id || fieldContext?.id || '';
  const formItemId = itemContext?.controlId || fieldContext?.formItemId || `${baseId}-item`;
  const formDescriptionId =
    itemContext?.descriptionId ?? fieldContext?.formDescriptionId ?? `${baseId}-description`;
  const formMessageId =
    itemContext?.messageId ?? fieldContext?.formMessageId ?? `${baseId}-message`;
  const hasError = itemContext?.hasError ?? fieldContext?.hasError ?? false;
  const error = itemContext?.error ?? fieldContext?.error;
  const name = fieldContext?.name;

  return {
    id: baseId,
    name,
    formItemId,
    formDescriptionId,
    formMessageId,
    hasError,
    error,
    isDescribedByDescription: Boolean(itemContext?.descriptionId),
    isDescribedByMessage: Boolean(itemContext?.messageId),
    setIsDescribedByDescription: () => {},
    setIsDescribedByMessage: () => {},
  };
}

// -----------------------------------------------------------------------------
// FormField Provider
// -----------------------------------------------------------------------------

export interface FormFieldProps {
  /** Optional custom base ID for the field */
  id?: string;
  /** Field name identifier */
  name?: string;
  /** Error message string, React node, or boolean flag */
  error?: string | boolean | React.ReactNode;
  /** Optional custom control ID override */
  controlId?: string;
  /** Optional custom description ID override */
  descriptionId?: string;
  /** Optional custom error message ID override */
  messageId?: string;
  children: React.ReactNode;
}

/**
 * FormField Component
 * Top-level provider establishing base identifiers and error state for a form control.
 */
export const FormField: React.FC<FormFieldProps> = ({
  id: customId,
  name,
  error,
  controlId: customControlId,
  descriptionId: customDescriptionId,
  messageId: customMessageId,
  children,
}) => {
  const generatedId = React.useId();
  const id = customId || (name ? `field-${name}` : `field-${generatedId}`);
  const formItemId = customControlId || `${id}-item`;
  const formDescriptionId = customDescriptionId || `${id}-description`;
  const formMessageId = customMessageId || `${id}-message`;

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
      isDescribedByDescription: true,
      isDescribedByMessage: hasError,
      setIsDescribedByDescription: () => {},
      setIsDescribedByMessage: () => {},
    }),
    [id, name, formItemId, formDescriptionId, formMessageId, hasError, error]
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

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional custom control ID override */
  controlId?: string;
  /** Optional custom description ID override */
  descriptionId?: string;
  /** Optional custom message ID override */
  messageId?: string;
}

interface DiscoveredIds {
  controlId?: string;
  hasDescription: boolean;
  descriptionId?: string;
  hasMessage: boolean;
  messageId?: string;
  messageHasChildren?: boolean;
}

function discoverFormItemChildren(children: React.ReactNode): DiscoveredIds {
  let controlId: string | undefined;
  let hasDescription = false;
  let descriptionId: string | undefined;
  let hasMessage = false;
  let messageId: string | undefined;
  let messageHasChildren = false;

  function traverse(node: React.ReactNode) {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;

      const childType = child.type;
      const childProps = child.props as {
        id?: string;
        children?: React.ReactNode;
      };

      // Handle React.Fragment
      if (childType === React.Fragment) {
        traverse(childProps.children);
        return;
      }

      // Check for FormControl
      if (
        childType === FormControl ||
        (typeof childType === 'object' &&
          childType !== null &&
          (childType as { displayName?: string }).displayName === 'FormControl')
      ) {
        if (typeof childProps.id === 'string' && childProps.id) {
          controlId = childProps.id;
        } else if (React.isValidElement(childProps.children)) {
          const innerProps = childProps.children.props as { id?: string };
          if (typeof innerProps.id === 'string' && innerProps.id) {
            controlId = innerProps.id;
          }
        }
      }

      // Check for FormDescription
      if (
        childType === FormDescription ||
        (typeof childType === 'object' &&
          childType !== null &&
          (childType as { displayName?: string }).displayName === 'FormDescription')
      ) {
        hasDescription = true;
        if (typeof childProps.id === 'string' && childProps.id) {
          descriptionId = childProps.id;
        }
      }

      // Check for FormMessage
      if (
        childType === FormMessage ||
        (typeof childType === 'object' &&
          childType !== null &&
          (childType as { displayName?: string }).displayName === 'FormMessage')
      ) {
        hasMessage = true;
        if (typeof childProps.id === 'string' && childProps.id) {
          messageId = childProps.id;
        }
        if (childProps.children) {
          messageHasChildren = true;
        }
      }

      // Recurse into nested non-control elements
      if (
        childType !== FormControl &&
        childType !== FormDescription &&
        childType !== FormMessage &&
        childProps.children
      ) {
        traverse(childProps.children);
      }
    });
  }

  traverse(children);
  return { controlId, hasDescription, descriptionId, hasMessage, messageId, messageHasChildren };
}

export const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  (
    {
      className,
      controlId: propControlId,
      descriptionId: propDescriptionId,
      messageId: propMessageId,
      children,
      ...props
    },
    ref
  ) => {
    const fieldContext = React.useContext(FormFieldContext);
    const baseId = fieldContext?.id || 'form-item';
    const defaultControlId = fieldContext?.formItemId || `${baseId}-item`;
    const defaultDescriptionId = fieldContext?.formDescriptionId || `${baseId}-description`;
    const defaultMessageId = fieldContext?.formMessageId || `${baseId}-message`;
    const hasError = fieldContext?.hasError ?? false;
    const error = fieldContext?.error;

    // Discover rendered child primitives synchronously without effect lag
    const discovered = discoverFormItemChildren(children);

    const resolvedControlId =
      propControlId || discovered.controlId || defaultControlId;

    const resolvedDescriptionId = discovered.hasDescription
      ? propDescriptionId || discovered.descriptionId || defaultDescriptionId
      : undefined;

    const isMessageRendered =
      discovered.hasMessage &&
      (discovered.messageHasChildren || (hasError && Boolean(error)));

    const resolvedMessageId = isMessageRendered
      ? propMessageId || discovered.messageId || defaultMessageId
      : undefined;

    const itemContextValue = React.useMemo<FormItemContextValue>(
      () => ({
        id: baseId,
        controlId: resolvedControlId,
        descriptionId: resolvedDescriptionId,
        messageId: resolvedMessageId,
        hasError,
        error,
      }),
      [
        baseId,
        resolvedControlId,
        resolvedDescriptionId,
        resolvedMessageId,
        hasError,
        error,
      ]
    );

    return (
      <FormItemContext.Provider value={itemContextValue}>
        <div
          ref={ref}
          className={cn('space-y-1.5 w-full flex flex-col', className)}
          {...props}
        >
          {children}
        </div>
      </FormItemContext.Provider>
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
>(({ className, htmlFor: customHtmlFor, indicateError = false, ...props }, ref) => {
  const { formItemId, hasError } = useFormField();

  return (
    <Label
      ref={ref}
      htmlFor={customHtmlFor || formItemId}
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
  (
    {
      children,
      id: customControlId,
      'aria-describedby': controlDescribedBy,
      'aria-invalid': controlAriaInvalid,
      ...props
    },
    ref
  ) => {
    const {
      formItemId,
      formDescriptionId,
      formMessageId,
      hasError,
      isDescribedByDescription,
      isDescribedByMessage,
    } = useFormField();

    const existingDescribedBy = [
      controlDescribedBy,
      children.props['aria-describedby'],
    ]
      .filter((v): v is string => typeof v === 'string' && Boolean(v.trim()))
      .join(' ');

    const tokens: string[] = [];
    if (existingDescribedBy) {
      tokens.push(...existingDescribedBy.trim().split(/\s+/));
    }
    if (isDescribedByDescription && formDescriptionId) {
      tokens.push(formDescriptionId);
    }
    if (isDescribedByMessage && formMessageId) {
      tokens.push(formMessageId);
    }

    // Deduplicate tokens while strictly preserving order
    const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
    const ariaDescribedBy =
      uniqueTokens.length > 0 ? uniqueTokens.join(' ') : undefined;

    const resolvedId =
      customControlId ||
      children.props.id ||
      formItemId;

    const resolvedAriaInvalid =
      controlAriaInvalid !== undefined
        ? controlAriaInvalid
        : children.props['aria-invalid'] !== undefined
        ? children.props['aria-invalid']
        : hasError
        ? 'true'
        : undefined;

    return React.cloneElement(children, {
      ...props,
      id: resolvedId,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': resolvedAriaInvalid,
      ref,
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
  const { formDescriptionId } = useFormField();

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
  const { formMessageId, hasError, error } = useFormField();

  const message = children || (typeof error === 'string' ? error : null);

  if (!hasError || !message) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={customId || formMessageId}
      role="alert"
      className={cn('text-xs font-medium text-semantic-error leading-normal', className)}
      {...props}
    >
      {message}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';
