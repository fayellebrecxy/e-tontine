"use client";

import * as React from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  iconClassName?: string;
  toggleClassName?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      iconClassName,
      toggleClassName,
      showPasswordLabel = "Afficher le mot de passe",
      hidePasswordLabel = "Masquer le mot de passe",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <LockKeyhole
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline",
            iconClassName,
          )}
          aria-hidden
        />
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={cn("pl-10 pr-11", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface",
            toggleClassName,
          )}
          aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
