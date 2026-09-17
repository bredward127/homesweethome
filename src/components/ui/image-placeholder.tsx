import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Marketing image slot.
 *
 * Renders a calm, on-brand CSS-drawn placeholder until a real asset is
 * supplied. Nothing about the page's usability depends on the image being
 * present, which is why no critical copy or control is ever placed inside one.
 *
 * When an approved asset exists (uploaded by an admin, or generated through
 * the optional fal.ai adapter and then approved), pass `src` and `alt`.
 */
export type ImagePlaceholderProps = {
  /** Approved asset URL. Omit to render the placeholder. */
  src?: string | null;
  /** Required whenever `src` is set. Use "" only for purely decorative art. */
  alt?: string;
  /** Short note describing the intended asset, shown in the placeholder. */
  label?: string;
  aspect?: "square" | "video" | "portrait" | "wide";
  className?: string;
  priority?: boolean;
  sizes?: string;
};

const ASPECTS: Record<NonNullable<ImagePlaceholderProps["aspect"]>, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/7]",
};

export function ImagePlaceholder({
  src,
  alt,
  label = "Photography placeholder",
  aspect = "video",
  className,
  priority,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: ImagePlaceholderProps) {
  const shell = cn(
    "relative overflow-hidden rounded-card border border-cream-300",
    ASPECTS[aspect],
    className,
  );

  if (src) {
    return (
      <div className={shell}>
        <Image src={src} alt={alt ?? ""} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(shell, "bg-cream-200")}
      // Decorative: the surrounding copy carries the meaning.
      role="img"
      aria-label={label}
    >
      {/* Soft, hand-drawn rooflines — a local-neighbourhood motif that needs
          no external asset and degrades gracefully at any size. */}
      <svg
        className="absolute inset-0 size-full text-sage-300"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="400" height="225" className="fill-cream-200" />
        <g className="stroke-current" fill="none" strokeWidth="2" strokeLinejoin="round">
          <path d="M20 170 L20 120 L60 88 L100 120 L100 170 Z" />
          <path d="M120 170 L120 108 L168 72 L216 108 L216 170 Z" />
          <path d="M236 170 L236 126 L276 96 L316 126 L316 170 Z" />
          <path d="M330 170 L330 112 L366 86 L400 112" />
        </g>
        <line x1="0" y1="170" x2="400" y2="170" className="stroke-sage-500" strokeWidth="2.5" />
        <circle cx="168" cy="118" r="9" className="fill-clay-200" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
