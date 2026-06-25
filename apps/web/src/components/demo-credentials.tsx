'use client';

import type { DemoAccounts } from '@/lib/kiosk-api';

type DemoCredentialsProps = {
  accounts: DemoAccounts | null;
  variant: 'admin' | 'kiosk';
};

export function DemoCredentials({ accounts, variant }: DemoCredentialsProps) {
  if (!accounts) {
    return null;
  }

  const account = variant === 'admin' ? accounts.admin : accounts.kiosk;
  const password = accounts.passwordHint;

  if (!account || !password) {
    return null;
  }

  const loginField =
    variant === 'admin' && 'email' in account
      ? `email: ${account.email}`
      : 'username' in account
        ? `username: ${account.username}`
        : null;

  if (!loginField) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-[#f7f6f3] rounded-lg border border-[#e5e1d7]">
      <p className="font-nunito text-xs text-[#1f1b16] text-center">
        Login Credentials: {loginField} and password:{' '}
        <span className="font-semibold">{password}</span>
      </p>
    </div>
  );
}
