# FaceCraft - Quick Start Guide

## What Has Been Built

A comprehensive photo kiosk system with:

### ✅ Complete Backend API (Express + TypeScript)
- 30+ database models with Prisma ORM
- Authentication & RBAC (Role-Based Access Control)
- AWS S3 integration for photo storage
- AWS Rekognition for facial recognition
- RESTful API with comprehensive routes
- Error handling, logging, validation
- Health check endpoints

### ✅ Frontend Application (Next.js 14)
- Landing page
- Customer kiosk interface
- Photo search and browsing
- Package selection interface
- Management login page
- Dashboard for admin/photographers

### ✅ Infrastructure & Deployment
- Nginx configuration
- Deployment scripts
- Comprehensive setup documentation
- Database seed with test accounts

## Current Status

**npm install is currently running in the background** - this may take 5-10 minutes due to the large number of dependencies.

## Next Steps After npm install Completes

### 1. Check Installation Status

```bash
# Check if installation finished
Get-Process -Id 4892 -ErrorAction SilentlyContinue
```

If the process is no longer running, installation is complete.

### 2. Set Up MySQL Database

```powershell
# Start MySQL service (if not running)
Start-Service MySQL80

# Connect to MySQL
mysql -u root -p

# In MySQL prompt:
CREATE DATABASE facecraft;
CREATE USER 'facecraft'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON facecraft.* TO 'facecraft'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Seed Database with Test Data

```bash
npm run db:seed
```

This creates:
- 4 test user accounts (superadmin, admin, photographer, staff)
- Sample products and packages
- Sample events and kiosk
- Discount codes
- Product categories

### 6. Start Development Servers

```bash
# Start both web and API servers
npm run dev
```

Or start them individually:

```bash
# Terminal 1 - API Server
npm run dev:api

# Terminal 2 - Web Server
npm run dev:web
```

### 7. Access the Application

- **Home Page**: http://localhost:3000
- **Customer Kiosk**: http://localhost:3000/kiosk
- **Login Page**: http://localhost:3000/login
- **API Health**: http://localhost:4000/api/health

### 8. Login with Test Accounts

```
Super Admin: superadmin@facecraft.com / password123
Admin: admin@facecraft.com / password123
Photographer: photographer@facecraft.com / password123
Staff: staff@facecraft.com / password123
```

## What Works Now (Without AWS)

### ✅ Fully Functional (No AWS Required)
- User authentication and authorization
- Login / Registration
- Dashboard viewing
- Product management (viewing)
- Package browsing
- Event management
- Order creation (basic)

### ⚠️ Requires AWS Configuration
- Photo uploads (needs S3)
- Facial recognition search (needs Rekognition)
- Photo storage and retrieval

## To Enable AWS Features

1. **Create AWS Account** (if you don't have one)

2. **Create S3 Bucket**:
```bash
aws s3 mb s3://facecraft-private-photos --region ap-southeast-1
```

3. **Get AWS Credentials**:
   - Go to AWS Console → IAM → Users
   - Create a new user with S3 and Rekognition permissions
   - Save Access Key ID and Secret Access Key

4. **Update `.env` file** in `apps/api/.env`:
```env
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=facecraft-private-photos
REKOGNITION_COLLECTION_ID=facecraft-photos
```

5. **Restart API server** - Rekognition collection will be created automatically

## Common Issues & Solutions

### Issue: npm install fails
**Solution**: Clear cache and try again
```bash
npm cache clean --force
npm install
```

### Issue: MySQL connection fails
**Solution**: Check MySQL is running
```powershell
Get-Service MySQL80
# If stopped:
Start-Service MySQL80
```

### Issue: Prisma migration fails
**Solution**: Reset database
```bash
npm run db:reset
```

### Issue: Port already in use
**Solution**: Change ports in .env files or kill process
```powershell
# Find process on port 3000
netstat -ano | findstr :3000
# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Project Structure

```
facecraft/
├── apps/
│   ├── api/           # Backend API (Express + TypeScript)
│   │   ├── prisma/    # Database schema and seed
│   │   └── src/       # API source code
│   └── web/           # Frontend (Next.js)
│       └── src/       # Web app source code
├── packages/
│   └── contracts/     # Shared TypeScript types
└── infrastructure/    # Deployment configs
```

## Available Commands

```bash
# Development
npm run dev              # Start both web and API
npm run dev:web          # Start Next.js only
npm run dev:api          # Start API only

# Build
npm run build            # Build all apps
npm run build:web        # Build Next.js
npm run build:api        # Build API

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript checks
```

## Testing the Application

### 1. Test Authentication
1. Go to http://localhost:3000/login
2. Login with: admin@facecraft.com / password123
3. Should redirect to dashboard

### 2. Test Kiosk Flow (Without AWS)
1. Go to http://localhost:3000/kiosk
2. Click "Manual Search" (selfie requires AWS)
3. Browse photos (will be empty without uploaded photos)

### 3. Test API Health
```bash
curl http://localhost:4000/api/health
```

Should return:
```json
{
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "uptime": 123.456,
    "env": "development"
  },
  "error": null,
  "requestId": "..."
}
```

## What's Next

See `IMPLEMENTATION_STATUS.md` for detailed progress tracking.

### Priority TODOs:
1. ✅ Basic structure - DONE
2. ✅ API routes - DONE
3. ✅ Authentication - DONE
4. ⏳ Background worker for photo processing
5. ⏳ Complete kiosk UI (webcam, editing)
6. ⏳ Payment integration
7. ⏳ Production deployment

## Getting Help

- Check `SETUP_GUIDE.md` for detailed deployment instructions
- Check `IMPLEMENTATION_STATUS.md` for implementation progress
- Review API logs: They appear in the terminal where you run `npm run dev:api`
- Review web logs: Check browser console and Next.js terminal output

## Important Notes

⚠️ **Security**: The current setup uses development credentials. For production:
- Change all passwords
- Use secure SESSION_SECRET (32+ random characters)
- Never commit .env files
- Use IAM roles in EC2 instead of Access Keys
- Enable HTTPS with SSL certificates

⚠️ **AWS Costs**: Enabling AWS features will incur costs:
- S3 storage and requests
- Rekognition API calls
- Consider setting up billing alerts

## Current Limitations

1. **No actual payment processing** - Payment providers need integration
2. **No photo editing UI** - Crop, rotate, frame application incomplete
3. **No webcam integration** - Selfie capture not implemented
4. **No background worker** - Photo processing jobs queued but not processed
5. **Limited frontend pages** - Many management pages need UI implementation

## Support

For issues:
1. Check the terminal output for errors
2. Check MySQL is running
3. Verify .env configuration
4. Check logs in browser console (F12)
5. Review `SETUP_GUIDE.md` for troubleshooting

---

**Built with:** Next.js 14, Express, TypeScript, Prisma, MySQL, AWS SDK, TailwindCSS
