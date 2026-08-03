"use client";

import { cn } from "@/lib/utils";

export type LoaderProps = {
  variant?: "typing" | "circular";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
};

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

function TypingLoader({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dotSizes = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  };
  return (
    <div
      className={cn("flex gap-0.5 items-center", className)}
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full bg-current animate-[typing_1.4s_ease-in-out_infinite]",
            dotSizes[size]
          )}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function CircularLoader({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <svg
      className={cn("animate-spin text-current", sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Loader({
  variant = "typing",
  size = "md",
  text,
  className,
}: LoaderProps) {
  if (variant === "circular") {
    return <CircularLoader className={className} size={size} />;
  }
  if (text) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TypingLoader size={size} />
        <span className="text-sm text-muted-foreground">{text}</span>
      </div>
    );
  }
  return <TypingLoader className={className} size={size} />;
}
