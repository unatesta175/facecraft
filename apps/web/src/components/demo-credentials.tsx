'use client';

import type { DemoAccounts } from '@/lib/kiosk-api';

type DemoCredentialsProps = {
  accounts: DemoAccounts | null;
  variant: 'admin' | 'kiosk';
  onApply?: (credentials: { login: string; password: string }) => void;
};

export function DemoCredentials({ accounts, variant, onApply }: DemoCredentialsProps) {
  if (!accounts) {
    return null;
  }

  const account = variant === 'admin' ? accounts.admin : accounts.kiosk;
  const password = accounts.passwordHint ?? 'password123';

  if (!account) {
    return null;
  }

  const loginLabel = variant === 'admin' ? 'Email' : 'Username';
  const loginValue =
    variant === 'admin' && 'email' in account
      ? account.email
      : 'username' in account
        ? account.username
        : null;

  if (!loginValue) {
    return null;
  }

  return (
    <div className="mt-5 rounded-xl border border-[--color-border] bg-[--color-surface-muted] p-4">
      <p className="font-jakarta text-xs font-semibold uppercase tracking-wide text-[--color-text-secondary]">
        Demo credentials
      </p>
      <div className="mt-3 space-y-2 font-nunito text-sm text-[--color-text-primary]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[--color-text-secondary]">{loginLabel}</span>
          <span className="font-medium">{loginValue}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[--color-text-secondary]">Password</span>
          <span className="font-medium">{password}</span>
        </div>
      </div>
      {onApply ? (
        <button
          type="button"
          onClick={() => onApply({ login: loginValue, password })}
          className="mt-3 w-full rounded-lg border border-[--color-border] bg-white px-3 py-2 font-nunito text-sm font-medium text-[--color-text-primary] transition-colors hover:bg-[--color-gold-tint] hover:text-[--color-gold-tint-text]"
        >
          Use demo credentials
        </button>
      ) : null}
    </div>
  );
}
