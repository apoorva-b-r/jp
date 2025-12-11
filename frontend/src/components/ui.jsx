import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* -----------------------------------------------
   BUTTON
------------------------------------------------*/
export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variants = {
    primary:
      "bg-[var(--color-primary)] text-primary hover:bg-[var(--color-primary-hover)] shadow-[0_8px_24px_rgba(22,34,102,0.12)] focus-visible:ring-[var(--color-secondary)]",
    secondary:
      "bg-[#F1E4D1] text-black hover:brightness-95 border border-transparent focus-visible:ring-[#162266]",
    outline:
      "bg-transparent text-secondary border border-[#D0E6FD]/20 hover:bg-[var(--color-primary)/6] focus-visible:ring-[var(--color-secondary)]",
    ghost:
      "bg-transparent text-secondary hover:bg-[var(--color-primary)/6] focus-visible:ring-[var(--color-secondary)]",
    destructive:
      "bg-[#7a1622] text-white hover:bg-[#8f2230] focus-visible:ring-[#8f2230]",
    link: "bg-transparent text-[#D0E6FD] underline-offset-4 hover:underline"
  };

  const sizes = {
    md: "h-11 px-5",
    sm: "h-9 px-3 text-sm",
    lg: "h-12 px-6 text-lg",
    icon: "h-10 w-10"
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

/* -----------------------------------------------
   INPUT
------------------------------------------------*/
export function Input({ className, type = "text", ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl bg-input text-secondary border border-[#D0E6FD]/20 px-4 py-2 placeholder:text-[rgba(208,230,253,0.7)] focus:outline-none focus:ring-2 focus:ring-[#D0E6FD] focus:border-transparent backdrop-blur-md",
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------
   TEXTAREA
------------------------------------------------*/
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-2xl bg-input text-secondary border border-[#D0E6FD]/20 px-4 py-3 placeholder:text-[rgba(208,230,253,0.7)] focus:outline-none focus:ring-2 focus:ring-[#D0E6FD] backdrop-blur-md",
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------
   LABEL
------------------------------------------------*/
export function Label({ className, ...props }) {
  return (
    <label
      className={cn("text-sm font-medium text-highlight tracking-tight", className)}
      {...props}
    />
  );
}

/* -----------------------------------------------
   CARD
------------------------------------------------*/
export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
          "rounded-2xl bg-[#0A0F1F] text-secondary border border-[#F1E4D1]/8 shadow-lg backdrop-blur-lg transition-all duration-300",
          className
        )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn("text-2xl font-semibold text-highlight tracking-tight", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-sm text-secondary/90", className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

/* -----------------------------------------------
   BADGE
------------------------------------------------*/
export function Badge({ className, variant = "primary", ...props }) {
    const variants = {
    primary: "bg-[var(--color-primary)] text-primary",
    bone: "bg-[var(--color-highlight)] text-black",
    outline: "border border-[#D0E6FD]/20 text-secondary",
    muted: "bg-[var(--color-primary)]/12 text-secondary/80",
    destructive: "bg-[#7a1622] text-white"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------
   CHECKBOX
------------------------------------------------*/
export function Checkbox({ className, checked, onCheckedChange, ...props }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        "h-5 w-5 rounded-md bg-input border border-[#D0E6FD]/20 text-[var(--color-primary)] focus:ring-2 focus:ring-[#D0E6FD] transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------
   SELECT
------------------------------------------------*/
export function Select({ className, ...props }) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl bg-input border border-[#D0E6FD]/20 px-4 py-2 text-secondary focus:outline-none focus:ring-2 focus:ring-[#D0E6FD] transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------
   ALERT
------------------------------------------------*/
export function Alert({ className, variant = "info", ...props }) {
    const variants = {
    info: "bg-surface text-secondary border-l-4 border-[var(--color-primary)]",
    success: "bg-[#071622] text-secondary border-l-4 border-[#1f8a5a]",
    warning: "bg-[#2f1a07] text-highlight border-l-4 border-[#f1c40f]",
    destructive: "bg-[#2f0f0f] text-highlight border-l-4 border-[#a02a2a]",
    default: "bg-surface text-secondary border-l-4 border-[var(--color-primary)]"
  };

  return (
    <div
      className={cn("rounded-xl p-4 text-sm backdrop-blur-md transition-all duration-300", variants[variant], className)}
      {...props}
    />
  );
}

/* -----------------------------------------------
   SEPARATOR
------------------------------------------------*/
export function Separator({ className, orientation = "horizontal", ...props }) {
  return (
    <div
      className={cn(
        "bg-[var(--color-secondary)]/10",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------
   DIALOG (MODAL)
------------------------------------------------*/
export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-lg"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">{children}</div>
    </div>
  );
}

export function DialogContent({ className, ...props }) {
  return (
    <div
      className={cn(
        "max-w-lg mx-auto rounded-2xl bg-[#0A0F1F] text-[#D0E6FD] border border-[#F1E4D1]/8 shadow-2xl p-6 backdrop-blur-lg transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-xl font-semibold text-[#F1E4D1] tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-[#D0E6FD]/90", className)} {...props} />;
}
