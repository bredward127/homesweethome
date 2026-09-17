"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { Option } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

/**
 * Large, tappable choice cards.
 *
 * Built on real radio and checkbox inputs rather than divs with click
 * handlers, so keyboard navigation, form semantics, and screen-reader
 * announcements all work without reimplementation. The input is visually
 * hidden but still focusable, and the focus ring is drawn on the card.
 */

const cardClasses =
  "relative flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 bg-cream-50 p-4 text-left transition-colors " +
  "hover:border-sage-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sage-600";

export function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  legend,
  description,
  error,
  columns = 1,
}: {
  name: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  legend: string;
  description?: string;
  error?: string;
  columns?: 1 | 2;
}) {
  const errorId = `${name}-error`;
  const descriptionId = `${name}-description`;

  return (
    <fieldset
      aria-describedby={cn(error ? errorId : undefined, description ? descriptionId : undefined) || undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
        {legend}
      </legend>
      {description ? (
        <p id={descriptionId} className="mt-2 text-[0.9375rem] leading-relaxed text-ink-600">
          {description}
        </p>
      ) : null}

      <div className={cn("mt-5 grid gap-3", columns === 2 && "sm:grid-cols-2")}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(cardClasses, selected ? "border-sage-600 bg-sage-50" : "border-cream-300")}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-sage-600 bg-sage-600" : "border-cream-400",
                )}
              >
                {selected ? <span className="size-2 rounded-full bg-cream-50" /> : null}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-medium text-ink-800">{option.label}</span>
                {option.hint ? (
                  <span className="text-sm leading-relaxed text-ink-600">{option.hint}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function CheckboxGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  legend,
  description,
  error,
  columns = 2,
}: {
  name: string;
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  legend: string;
  description?: string;
  error?: string;
  columns?: 1 | 2;
}) {
  const errorId = `${name}-error`;
  const descriptionId = `${name}-description`;

  const toggle = (option: T) => {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  };

  return (
    <fieldset
      aria-describedby={cn(error ? errorId : undefined, description ? descriptionId : undefined) || undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
        {legend}
      </legend>
      {description ? (
        <p id={descriptionId} className="mt-2 text-[0.9375rem] leading-relaxed text-ink-600">
          {description}
        </p>
      ) : null}

      <div className={cn("mt-5 grid gap-3", columns === 2 && "sm:grid-cols-2")}>
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(cardClasses, selected ? "border-sage-600 bg-sage-50" : "border-cream-300")}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => toggle(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2",
                  selected ? "border-sage-600 bg-sage-600" : "border-cream-400",
                )}
              >
                {selected ? <Check className="size-3.5 text-cream-50" strokeWidth={3} /> : null}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-medium text-ink-800">{option.label}</span>
                {option.hint ? (
                  <span className="text-sm leading-relaxed text-ink-600">{option.hint}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
