import type { PaymentProvider } from "@/lib/generated/prisma";

export const PAYMENT_SIMULATION_DELAY_MS = 5_000;
export const PAYMENT_SIMULATION_OUTBOUND_DELAY_MS = 4_000;

const PROVIDER_PREFIX: Record<PaymentProvider, string> = {
  ORANGE_MONEY: "OM",
  MTN_MOMO: "MOMO",
};

export function normalizePaymentPhone(telephone: string) {
  return telephone.trim().replace(/\s+/g, "").replace(/^\+/, "");
}

export function maskPaymentPhone(telephone: string) {
  const digits = normalizePaymentPhone(telephone).replace(/\D/g, "");
  if (digits.length < 4) return digits;
  const lastTwo = digits.slice(-2);
  const prefix = digits.slice(0, 1);
  return `${prefix}xx xx xx ${lastTwo}`;
}

export function shouldSimulatePaymentFailure(telephone: string) {
  const digits = normalizePaymentPhone(telephone).replace(/\D/g, "");
  return digits.endsWith("99");
}

export function generateProviderReference(provider: PaymentProvider, date = new Date()) {
  const prefix = PROVIDER_PREFIX[provider];
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
  return `${prefix}${yy}${mm}${dd}.${hh}${min}.A${seq}`;
}

export function getProviderLabel(provider: PaymentProvider) {
  return provider === "ORANGE_MONEY" ? "Orange Money" : "MTN MoMo";
}

export function getSimulationDelayMs(direction: "INBOUND" | "OUTBOUND") {
  return direction === "OUTBOUND"
    ? PAYMENT_SIMULATION_OUTBOUND_DELAY_MS
    : PAYMENT_SIMULATION_DELAY_MS;
}

export function getUssdHint(provider: PaymentProvider) {
  return provider === "ORANGE_MONEY"
    ? "Tapez le #150# si vous ne recevez pas la notification."
    : "Tapez le *126# si vous ne recevez pas la notification.";
}
