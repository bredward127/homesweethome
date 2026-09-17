"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives.
 *
 * Every control is wired to its label, description, and error message by id,
 * so screen readers announce the full context and a validation failure is
 * never conveyed by colour alone.
 */

const FieldContext = React.createContext<{
  id: string;
  descriptionId: string;
  errorId: string;
  hasError: boolean;
} | null>(null);

function useField() {
  const context = React.useContext(FieldContext);
  if (!context) throw new Error("Field components must be used inside <Field>.");
  return context;
}

export type FieldProps = {
  /** Stable id for the control; auto-generated when omitted. */
  id?: string;
  label: string;
  /** Helper text rendered under the label. */
  description?: string;
  error?: string;
  /** Marks the field required and shows the required indicator. */
  required?: boolean;
  /** Shows an explicit "Optional" hint. Use on genuinely optional questions. */
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  id,
  label,
  description,
  error,
  required,
  optional,
  className,
  children,
}: FieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const value = React.useMemo(
    () => ({
      id: fieldId,
      descriptionId: `${fieldId}-description`,
      errorId: `${fieldId}-error`,
      hasError: Boolean(error),
    }),
    [fieldId, error],
  );

  return (
    <FieldContext.Provider value={value}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={fieldId} className="text-sm font-semibold text-ink-800">
          {label}
          {required ? (
            <span className="ml-1 text-danger-600" aria-hidden="true">
              *
            </span>
          ) : null}
          {optional ? (
            <span className="ml-2 text-xs font-normal text-ink-500">Optional</span>
          ) : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
        {description ? (
          <p id={value.descriptionId} className="text-sm text-ink-600">
            {description}
          </p>
        ) : null}
        {children}
        {error ? (
          <p id={value.errorId} className="text-sm font-medium text-danger-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

const controlClasses =
  "w-full rounded-xl border bg-cream-50 px-3.5 py-2.5 text-[0.9375rem] text-ink-800 " +
  "placeholder:text-ink-500/70 transition-colors " +
  "focus:outline-2 focus:outline-offset-2 focus:outline-sage-600 " +
  "disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-ink-500";

function useControlProps() {
  const { id, descriptionId, errorId, hasError } = useField();
  return {
    id,
    "aria-invalid": hasError || undefined,
    "aria-describedby": cn(hasError ? errorId : undefined, descriptionId) || undefined,
    className: hasError ? "border-danger-600" : "border-cream-400",
  };
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    const { className: stateClass, ...aria } = useControlProps();
    return <input ref={ref} {...aria} className={cn(controlClasses, stateClass, className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  const { className: stateClass, ...aria } = useControlProps();
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...aria}
      className={cn(controlClasses, stateClass, className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  const { className: stateClass, ...aria } = useControlProps();
  return (
    <select ref={ref} {...aria} className={cn(controlClasses, stateClass, className)} {...props}>
      {children}
    </select>
  );
});

/**
 * Standalone checkbox with its own label. Used for consent boxes, which must
 * always be individually labelled and never pre-checked.
 */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; error?: string }
>(function Checkbox({ className, label, error, id, ...props }, ref) {
  const generatedId = React.useId();
  const checkboxId = id ?? generatedId;
  const errorId = `${checkboxId}-error`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "mt-0.5 size-5 shrink-0 rounded border-2 accent-sage-600",
            error ? "border-danger-600" : "border-cream-400",
          )}
          {...props}
        />
        <label htmlFor={checkboxId} className="text-sm leading-relaxed text-ink-700">
          {label}
        </label>
      </div>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
