"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { IconChevronDown } from "@tabler/icons-react";

export type ScrollButtonProps = {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function ScrollButton({
  className,
  variant = "outline",
  size = "sm",
  ...props
}: ScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("shadow-sm", className)}
      onClick={() => scrollToBottom()}
      aria-label="Scroll to bottom"
      {...props}
    >
      <IconChevronDown className="size-4" />
    </Button>
  );
}

export { ScrollButton };
