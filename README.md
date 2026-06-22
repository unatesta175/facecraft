# FaceCraft

A production-oriented photo kiosk system with face recognition, photo editing, and e-commerce capabilities.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Backend**: Express.js with TypeScript
- **Database**: MySQL with Prisma ORM
- **Cloud Services**: AWS S3, AWS Rekognition
- **Styling**: Tailwind CSS, shadcn/ui
- **Deployment**: Single EC2 instance with Nginx

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+
- MySQL 8+
- AWS Account with S3 and Rekognition access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd facecraft
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Start MySQL and create database
mysql -u root -p
CREATE DATABASE facecraft;
CREATE USER 'facecraft'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON facecraft.* TO 'facecraft'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations and seed
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start development servers:
```bash
# Start both web and API
npm run dev

# Or start individually
npm run dev:web    # Next.js on port 3000
npm run dev:api    # Express on port 4000
npm run dev:worker # Background worker
```

### Development

- **Web App**: http://localhost:3000
- **API**: http://localhost:4000
- **API Health**: http://localhost:4000/api/health

### Building for Production

```bash
npm run build
```

### Database Management

```bash
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

## Project Structure

```
facecraft/
├── apps/
│   ├── web/         # Next.js application
│   └── api/         # Express API
├── packages/
│   ├── contracts/   # Shared types and schemas
│   ├── config/      # Shared configuration
│   └── ui/          # Shared UI components
├── infrastructure/
│   ├── nginx/       # Nginx configuration
│   ├── systemd/     # Service files
│   └── scripts/     # Deployment scripts
└── docs/            # Documentation

```

## Features

### Customer Kiosk
- Selfie-based photo search using AWS Rekognition
- Manual photo search with filters
- Photo editing (crop, rotate, resize, frames)
- Product selection and package configuration
- Cart with discount support
- Multiple payment methods (Card, QR, Cash)
- Receipt printing and digital gallery access

### Photographer Portal
- Event management
- Bulk photo upload with progress tracking
- Face indexing status monitoring
- Order management

### Admin Portal
- Dashboard with statistics
- User and role management (RBAC)
- Product and package management
- Order processing and status updates
- Kiosk management
- Discount management
- Audit logs

## Deployment

See [FACECRAFT_CURSOR_IMPLEMENTATION_PLAN.md](./FACECRAFT_CURSOR_IMPLEMENTATION_PLAN.md) for detailed deployment instructions to EC2.

## License

Proprietary - All rights reserved
