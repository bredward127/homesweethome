import { cn } from "@/lib/utils";

/**
 * FAQ list built on native <details>/<summary>, so it is keyboard accessible
 * and expandable without JavaScript.
 */
export function Faq({
  items,
  className,
}: {
  items: readonly { question: string; answer: string }[];
  className?: string;
}) {
  return (
    <dl className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <div key={item.question} className="rounded-card border border-cream-300 bg-cream-50">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card p-5 text-left text-base font-semibold text-ink-800 marker:hidden">
              <dt>{item.question}</dt>
              <span
                aria-hidden="true"
                className="shrink-0 text-2xl leading-none text-sage-600 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <dd className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-ink-600">
              {item.answer}
            </dd>
          </details>
        </div>
      ))}
    </dl>
  );
}
