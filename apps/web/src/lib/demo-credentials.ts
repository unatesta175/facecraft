export const STATIC_DEMO_PASSWORD = 'password123';

export const STATIC_DEMO_ACCOUNTS = {
  admin: {
    name: 'Ahmad Razif',
    email: 'admin@facecraft.com',
    username: 'ahmad.razif',
    role: 'ADMIN',
  },
  kiosk: {
    name: 'Main Lobby Kiosk',
    username: 'kiosk01',
    description: 'Primary kiosk at main lobby',
  },
  photographer: {
    name: 'Haris Farhan',
    username: 'haris.farhan',
    email: 'photographer@facecraft.com',
    role: 'STAFF',
  },
} as const;
