"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { maskPhoneBR } from "@/lib/auth/schemas";

/**
 * PhoneInput — input controlado que aplica máscara BR enquanto digita.
 * Compatível com react-hook-form via forwardRef + onChange/value padrão.
 *
 * O valor enviado para o form fica no formato "(31) 9 9999-9999".
 * Use unmaskPhone() ao persistir no banco se preferir armazenar dígitos puros.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, value, defaultValue, ...props }, ref) => {
    const [internal, setInternal] = React.useState<string>(() =>
      typeof value === "string"
        ? maskPhoneBR(value)
        : typeof defaultValue === "string"
          ? maskPhoneBR(defaultValue)
          : ""
    );

    React.useEffect(() => {
      if (typeof value === "string") setInternal(maskPhoneBR(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskPhoneBR(e.target.value);
      setInternal(masked);
      // Propaga para o react-hook-form com o valor mascarado.
      e.target.value = masked;
      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="(31) 9 9999-9999"
        value={internal}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";
