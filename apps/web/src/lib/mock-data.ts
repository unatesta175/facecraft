// Shared mock/seed data matching the Prisma schema
// Used as fallback when API is unavailable

export const MOCK_SIZES = [
  { id: 'size-4x6', height: 4, width: 6, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'size-5x7', height: 5, width: 7, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'size-8x10', height: 8, width: 10, createdAt: '2026-01-01T00:00:00Z' },
];

const PRODUCT_SIZE_IDS = ['size-4x6','size-5x7','size-8x10','size-4x6','size-5x7',null,null,'size-8x10','size-8x10','size-8x10','size-4x6','size-5x7','size-8x10','size-5x7','size-8x10','size-4x6','size-4x6',null,'size-8x10','size-5x7','size-4x6','size-5x7','size-5x7','size-4x6','size-4x6','size-5x7',null,null,null,'size-4x6','size-4x6'];

export const MOCK_PRODUCTS = Array.from({ length: 31 }, (_, i) => ({
  id: `prod-${String(i + 1).padStart(2, '0')}`,
  name: ['4x6 Standard Print','5x7 Standard Print','8x10 Large Print','Magnetic Photo 4x6','Magnetic Photo 5x7','Email Digital Copy HD','Email Digital Copy 4K','Certificate Left Style 1','Certificate Left Style 2','Certificate Right Style 1','Wallet Print x4','Postcard Print','Canvas Print 8x10','Photo Book Single Page','Panoramic Print','Keychain Photo Print','Fridge Magnet Set x2','Email Family Album','Graduation Certificate','Event Certificate','4x6 Matte Print','5x7 Glossy Print','Square Print 5x5','Bookmark Photo','Coaster Photo Set','Calendar Page','Mug Print Design','Tote Bag Design','T-Shirt Design File','Photo Strip x3','Instant Print 3x4'][i],
  price: [5,8,15,12,18,10,15,22,22,22,9,7,45,20,25,6,14,30,28,18,6,9,8,5,16,12,20,25,18,11,4][i],
  productType: ['OTHERS','OTHERS','OTHERS','MAGNET','MAGNET','EMAIL','EMAIL','CERTIFICATE_LEFT_1','CERTIFICATE_LEFT_2','CERTIFICATE_RIGHT_1','OTHERS','OTHERS','OTHERS','OTHERS','OTHERS','MAGNET','MAGNET','EMAIL','CERTIFICATE_LEFT_1','CERTIFICATE_RIGHT_1','OTHERS','OTHERS','OTHERS','OTHERS','MAGNET','OTHERS','EMAIL','EMAIL','EMAIL','OTHERS','OTHERS'][i],
  photoLimit: [1,1,1,1,1,5,10,1,1,1,4,1,1,2,1,1,2,20,1,1,1,1,1,1,4,1,1,1,1,3,1][i],
  sizeId: PRODUCT_SIZE_IDS[i] ?? null,
  status: 'ACTIVE',
  description: 'High quality product for your memories',
  imageUrl: null,
  createdAt: '2026-01-15T00:00:00Z',
}));

export const MOCK_COMBOS = [
  { id: 'combo-01', name: 'Heritage Ultimate - VIP Priority', price: 499, status: 'ACTIVE', description: 'Our flagship VIP priority package', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-02', name: 'Heritage Premium', price: 399, status: 'ACTIVE', description: 'Premium heritage package', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-03', name: 'Supreme 1', price: 300, status: 'ACTIVE', description: 'Supreme combo package tier 1', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-04', name: 'Heritage Book', price: 199, status: 'ACTIVE', description: 'Heritage book package', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-05', name: 'Premium Full Experience', price: 169, status: 'ACTIVE', description: 'Full experience premium package', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-06', name: 'Portrait Premium 1', price: 150, status: 'ACTIVE', description: 'Portrait premium package tier 1', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-07', name: 'Portrait Digital Pack', price: 99, status: 'ACTIVE', description: 'Digital portrait package', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-08', name: 'Print & Digital Pack', price: 59, status: 'ACTIVE', description: 'Combined print and digital package', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-09', name: 'Basic Print Pack', price: 50, status: 'ACTIVE', description: 'Basic print package', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-10', name: 'Digital Package', price: 89, status: 'ACTIVE', description: 'Full digital delivery package', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'combo-11', name: 'Starter Memories', price: 35, status: 'ACTIVE', description: 'Entry level memories package', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'combo-12', name: 'Family Bundle', price: 85, status: 'ACTIVE', description: 'Great value family bundle', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'combo-13', name: 'Wedding Classic', price: 250, status: 'ACTIVE', description: 'Classic wedding photo package', createdAt: '2026-02-10T00:00:00Z' },
  { id: 'combo-14', name: 'Wedding Premium', price: 350, status: 'ACTIVE', description: 'Premium wedding photo package', createdAt: '2026-02-10T00:00:00Z' },
  { id: 'combo-15', name: 'Corporate Event Pack', price: 180, status: 'ACTIVE', description: 'Corporate event package', createdAt: '2026-02-15T00:00:00Z' },
  { id: 'combo-16', name: 'Graduate Special', price: 120, status: 'ACTIVE', description: 'Special graduation package', createdAt: '2026-03-01T00:00:00Z' },
  { id: 'combo-17', name: 'Magnet Memories', price: 45, status: 'ACTIVE', description: 'Magnetic photo memories', createdAt: '2026-03-01T00:00:00Z' },
  { id: 'combo-18', name: 'Souvenir Set', price: 55, status: 'ACTIVE', description: 'Souvenir photo set', createdAt: '2026-03-10T00:00:00Z' },
  { id: 'combo-19', name: 'Mini Pack', price: 25, status: 'INACTIVE', description: 'Mini photo package', createdAt: '2026-03-15T00:00:00Z' },
  { id: 'combo-20', name: 'Expression Pack', price: 75, status: 'ACTIVE', description: 'Expression photo package', createdAt: '2026-03-20T00:00:00Z' },
  { id: 'combo-21', name: 'Square Album', price: 68, status: 'ACTIVE', description: 'Square album package', createdAt: '2026-04-01T00:00:00Z' },
  { id: 'combo-22', name: 'Calendar Pack', price: 95, status: 'ACTIVE', description: 'Calendar photo package', createdAt: '2026-04-01T00:00:00Z' },
  { id: 'combo-23', name: 'Merchandise Pack', price: 110, status: 'ACTIVE', description: 'Merchandise design package', createdAt: '2026-04-10T00:00:00Z' },
  { id: 'combo-24', name: 'Fashion Pack', price: 130, status: 'ACTIVE', description: 'Fashion photography package', createdAt: '2026-04-15T00:00:00Z' },
  { id: 'combo-25', name: 'Postcard Bundle', price: 40, status: 'ACTIVE', description: 'Postcard bundle package', createdAt: '2026-05-01T00:00:00Z' },
  { id: 'combo-26', name: 'Strip Pack', price: 30, status: 'INACTIVE', description: 'Photo strip package', createdAt: '2026-05-01T00:00:00Z' },
  { id: 'combo-27', name: 'Panoramic Bundle', price: 90, status: 'ACTIVE', description: 'Panoramic photo bundle', createdAt: '2026-05-10T00:00:00Z' },
  { id: 'combo-28', name: 'All-In-One Elite', price: 599, status: 'ACTIVE', description: 'The ultimate all-in-one package', createdAt: '2026-05-15T00:00:00Z' },
];

export const MOCK_DISCOUNTS = [
  { id: 'disc-01', code: 'WELCOME10', amount: 10, description: '10% off for new customers', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'disc-02', code: 'SUMMER25', amount: 25, description: 'Summer promotion RM25 off', createdAt: '2026-06-01T00:00:00Z' },
  { id: 'disc-03', code: 'VIP50', amount: 50, description: 'VIP exclusive RM50 off', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'disc-04', code: 'WEDDING15', amount: 15, description: 'Wedding package discount', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'disc-05', code: 'STAFF20', amount: 20, description: 'Staff member discount', createdAt: '2026-03-01T00:00:00Z' },
];

export const MOCK_FRAMES = Array.from({ length: 14 }, (_, i) => ({
  id: `frame-${String(i + 1).padStart(2, '0')}`,
  name: ['Classic Gold Border','Modern Minimalist','Vintage Floral','Wedding White','Corporate Blue','Birthday Confetti','Christmas Theme','Eid Mubarak','Graduation Cap','Nature Leaves','Abstract Art','Black & White Film','Rustic Wood','Luxury Marble'][i],
  imageUrl: null,
  status: i < 12 ? 'ACTIVE' : 'INACTIVE',
  createdAt: '2026-01-15T00:00:00Z',
}));

export const MOCK_KIOSKS = [
  { id: 'kiosk-01', name: 'Main Lobby Kiosk', username: 'kiosk01', description: 'Primary kiosk at main lobby', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'kiosk-02', name: 'Hall A Kiosk', username: 'kiosk02', description: 'Hall A — wedding events', status: 'ACTIVE', createdAt: '2026-01-05T00:00:00Z' },
  { id: 'kiosk-03', name: 'Hall B Kiosk', username: 'kiosk03', description: 'Hall B — corporate events', status: 'ACTIVE', createdAt: '2026-01-10T00:00:00Z' },
  { id: 'kiosk-04', name: 'Outdoor Kiosk', username: 'kiosk04', description: 'Outdoor garden area', status: 'INACTIVE', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'kiosk-05', name: 'VIP Lounge Kiosk', username: 'kiosk05', description: 'VIP lounge and private events', status: 'ACTIVE', createdAt: '2026-02-15T00:00:00Z' },
];

export const MOCK_USERS = [
  { id: 'user-01', staffCode: 'Fc101', name: 'Ahmad Razif', username: 'ahmad.razif', email: 'admin@facecraft.com', phone: '+60123456701', locationArea: 'Kuala Lumpur', role: 'ADMIN', status: 'ACTIVE', deletePermission: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'user-02', staffCode: 'Fc102', name: 'Siti Nabilah', username: 'siti.nabilah', email: 'manager@facecraft.com', phone: '+60123456702', locationArea: 'Petaling Jaya', role: 'MANAGER', status: 'ACTIVE', deletePermission: false, createdAt: '2026-01-05T00:00:00Z' },
  { id: 'user-03', staffCode: 'Fc103', name: 'Haris Farhan', username: 'haris.farhan', email: 'photographer@facecraft.com', phone: '+60123456703', locationArea: 'Shah Alam', role: 'STAFF', status: 'ACTIVE', deletePermission: false, createdAt: '2026-01-10T00:00:00Z' },
  { id: 'user-04', staffCode: 'Fc104', name: 'Nurul Ain', username: 'nurul.ain', email: 'staff2@facecraft.com', phone: '+60123456704', locationArea: 'Subang Jaya', role: 'STAFF', status: 'ACTIVE', deletePermission: false, createdAt: '2026-01-15T00:00:00Z' },
  { id: 'user-05', staffCode: 'Fc105', name: 'Rizal Hakim', username: 'rizal.hakim', email: 'staff3@facecraft.com', phone: '+60123456705', locationArea: 'Cyberjaya', role: 'STAFF', status: 'INACTIVE', deletePermission: false, createdAt: '2026-02-01T00:00:00Z' },
  { id: 'user-06', staffCode: 'Fc106', name: 'Thiviya Mogan', username: 'thiviya.mogan', email: 'supervisor@facecraft.com', phone: '+60123456706', locationArea: 'Putrajaya', role: 'SUPERVISOR', status: 'ACTIVE', deletePermission: false, createdAt: '2026-02-15T00:00:00Z' },
];

export const MOCK_OBJECTS = [
  { id: 'obj-01', title: 'Rose Bouquet', description: 'Elegant red rose arrangement', imageUrl: null, status: 'ACTIVE', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'obj-02', title: 'Butterfly Wings', description: 'Colorful butterfly decoration', imageUrl: null, status: 'ACTIVE', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'obj-03', title: 'Star Sparkle', description: 'Glittery star overlay', imageUrl: null, status: 'ACTIVE', createdAt: '2026-01-20T00:00:00Z' },
  { id: 'obj-04', title: 'Heart Frame', description: 'Romantic heart shaped frame', imageUrl: null, status: 'ACTIVE', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'obj-05', title: 'Leaf Wreath', description: 'Natural green leaf wreath', imageUrl: null, status: 'ACTIVE', createdAt: '2026-02-10T00:00:00Z' },
  { id: 'obj-06', title: 'Balloons', description: 'Festive balloon cluster', imageUrl: null, status: 'ACTIVE', createdAt: '2026-02-15T00:00:00Z' },
  { id: 'obj-07', title: 'Confetti Burst', description: 'Colorful confetti explosion', imageUrl: null, status: 'ACTIVE', createdAt: '2026-03-01T00:00:00Z' },
  { id: 'obj-08', title: 'Feather Plume', description: 'Elegant white feather decoration', imageUrl: null, status: 'INACTIVE', createdAt: '2026-03-10T00:00:00Z' },
  { id: 'obj-09', title: 'Crown Ornament', description: 'Royal gold crown accessory', imageUrl: null, status: 'ACTIVE', createdAt: '2026-04-01T00:00:00Z' },
  { id: 'obj-10', title: 'Ribbon Bow', description: 'Decorative silk ribbon bow', imageUrl: null, status: 'ACTIVE', createdAt: '2026-04-15T00:00:00Z' },
];

export const MOCK_ULTRA_OBJECTS = [
  { id: 'ultra-01', title: 'Wedding Decoration Set', description: 'Complete wedding overlay collection', imageUrl: null, status: 'ACTIVE', createdAt: '2026-03-01T00:00:00Z', objectIds: ['obj-01', 'obj-04', 'obj-10'] },
  { id: 'ultra-02', title: 'Party Celebration Set', description: 'Fun party decoration collection', imageUrl: null, status: 'ACTIVE', createdAt: '2026-04-01T00:00:00Z', objectIds: ['obj-06', 'obj-07', 'obj-03'] },
];

// Mock orders for demo
const orderStatuses = ['COMPLETED','COMPLETED','COMPLETED','PENDING','CANCELLED'];
const payTypes = ['CASH','CARD','QR'];
const kioskNames = ['Main Lobby Kiosk','Hall A Kiosk','Hall B Kiosk','VIP Lounge Kiosk'];
const staffNames = ['Haris Farhan','Nurul Ain','Rizal Hakim'];
const staffCodes = ['Fc103','Fc104','Fc105'];
export const MOCK_ORDERS = Array.from({ length: 42 }, (_, i) => {
  const daysAgo = Math.floor((i * 1.4) % 60);
  const d = new Date(2026, 5, 23);
  d.setDate(d.getDate() - daysAgo);
  const dateStr = d.toISOString().split('T')[0];
  const h = String(9 + (i % 12)).padStart(2, '0');
  const m = String((i * 7) % 60).padStart(2, '0');
  return {
    id: `order-${String(i + 1).padStart(3, '0')}`,
    orderCode: `ORD-${String(i + 1).padStart(3, '0')}-${1000000000 + i}`,
    kioskName: kioskNames[i % kioskNames.length],
    staffId: staffCodes[i % staffCodes.length],
    staffName: staffNames[i % staffNames.length],
    date: dateStr,
    time: `${h}:${m}`,
    paymentType: payTypes[i % payTypes.length],
    price: MOCK_COMBOS[i % MOCK_COMBOS.length].price,
    paymentStatus: orderStatuses[i % orderStatuses.length],
    createdAt: `${dateStr}T${h}:${m}:00Z`,
  };
});
