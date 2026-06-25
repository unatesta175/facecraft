'use client';

import type { DemoAccounts } from '@/lib/kiosk-api';

type DemoCredentialsProps = {
  accounts: DemoAccounts | null;
  variant: 'admin' | 'kiosk';
};

export function DemoCredentials({ accounts, variant }: DemoCredentialsProps) {
  if (!accounts) {
    return (
      <div className="mt-6 p-4 bg-[#f7f6f3] rounded-lg border border-[#e5e1d7]">
        <p className="font-nunito text-xs text-[#9a9286] text-center">
          Loading demo accounts...
        </p>
      </div>
    );
  }

  const account = variant === 'admin' ? accounts.admin : accounts.kiosk;

  if (!account) {
    return (
      <div className="mt-6 p-4 bg-[#f7f6f3] rounded-lg border border-[#e5e1d7]">
        <p className="font-nunito text-xs text-[#9a9286] text-center">
          No active {variant} account found in database. Run the seed script first.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-[#f7f6f3] rounded-lg border border-[#e5e1d7]">
      <p className="font-nunito text-xs text-[#9a9286] text-center mb-2">
        Demo account from database
      </p>
      {'email' in account && (
        <>
          <p className="font-nunito text-xs text-[#1f1b16] text-center mb-1">
            {account.name} ({account.role})
          </p>
          <p className="font-mono text-xs text-[#1f1b16] text-center mb-1">
            Email: <span className="font-semibold">{account.email}</span>
          </p>
        </>
      )}
      {'description' in account && (
        <>
          <p className="font-nunito text-xs text-[#1f1b16] text-center mb-1">
            {account.name}
            {account.description ? ` · ${account.description}` : ''}
          </p>
          <p className="font-mono text-xs text-[#1f1b16] text-center mb-1">
            Username: <span className="font-semibold">{account.username}</span>
          </p>
        </>
      )}
      {accounts.passwordHint && (
        <p className="font-mono text-xs text-[#1f1b16] text-center">
          Password: <span className="font-semibold">{accounts.passwordHint}</span>
        </p>
      )}
    </div>
  );
}
