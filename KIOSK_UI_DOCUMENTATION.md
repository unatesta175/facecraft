# FaceCraft Studio - Kiosk & Photographer UI

## Overview

A modern, minimalist SaaS-style UI for FaceCraft Studio's customer-facing kiosk and photographer interfaces, built with Next.js, shadcn/ui, and Framer Motion.

## Design System

### Fonts
- **Inter**: Primary font for headings and important UI elements
- **Nunito**: Body text, descriptions, and secondary elements  
- **Jakarta Sans Pro**: Accent font for special headers and branding

### Color Palette
All colors follow the established admin dashboard theme:

- **Background**: `#ffffff` (pure white)
- **Surface Muted**: `#f7f6f3` (subtle fills, input backgrounds)
- **Border**: `#e8e3d8` (card/table borders)
- **Text Primary**: `#1f1b16` (headings, primary text)
- **Text Secondary**: `#9a9286` (muted text, subtitles)
- **Gold (Primary)**: `#c9982f` (CTA buttons, active states)
- **Chocolate (Secondary)**: `#5c3a21` (secondary accents)
- **Success**: `#eef3e3` / `#436b35` (status indicators)
- **Danger**: `#a32d2d` (delete actions)

### Responsive Design
- **Desktop**: Standard breakpoints (1024px+)
- **21-inch Kiosk**: Optimized for 1920px+ touchscreens
  - Larger fonts (18px base)
  - Increased touch targets (48px minimum)
  - Enhanced spacing and button sizes
- **Touch Optimization**: Active states, larger scrollbars, no hover effects

---

## Customer Kiosk UI

### 1. **Login Page** (`/kiosk/login`)
Staff authentication before customer use.

**Features:**
- FaceCraft Studio logo with brand colors
- Username and password fields
- Show/hide password toggle
- Staff-only access messaging

**Route:** `/kiosk/login`

---

### 2. **Home Page** (`/kiosk/home`)
Hero section welcoming customers.

**Features:**
- Animated FaceCraft logo
- Hero text: "Welcome to Face Craft Studio"
- Call-to-action: "Take a Selfie" button
- Gradient background with brand colors
- Smooth entrance animations

**Route:** `/kiosk/home`

---

### 3. **Capture Page** (`/kiosk/capture`)
Webcam modal for selfie capture or manual search.

**Features:**
- Live webcam feed
- Circular face guide overlay
- Two action options:
  - **Capture Photo**: Takes selfie, shows preview with retry option
  - **Manual Search**: Skip to photo selection
- Smooth transitions between states

**Route:** `/kiosk/capture`

---

### 4. **Photo Selection Page** (`/kiosk/select-photos`)
Browse and select photos with filters and frames.

**Features:**
- Date and time filters
- Horizontal scrolling frame selector
- 2-column photo grid with infinite scroll
- Frame preview overlay on images
- Multi-select with checkboxes
- Selected count and frame name in sticky bottom bar
- Smooth animations for photo appearance

**Route:** `/kiosk/select-photos`

---

### 5. **Preview Modal** (`/kiosk/preview`)
Review selected photos with frames before proceeding.

**Features:**
- Rainbow stairs frame (matching your design)
- Navigation buttons (Previous/Next)
- Zoom in/out controls
- Rotate image button
- Current photo indicator (1 of 4)
- Page dots navigation
- "Apply" to proceed, "Close" to cancel

**Route:** `/kiosk/preview`

---

### 6. **Shop Page** (`/kiosk/shop`)
Package selection with product requirements and AI photo editor.

**Two-Column Layout:**

#### **Left Column: Packages**
- Package cards with name, description, price
- Product list showing photo requirements
- "Add" button per product (triggers frame preview)
- Progress tracking (green checkmarks when complete)
- "Add to Cart" enabled when all products fulfilled
- Confirmation prompt if trying to add second package

#### **Right Column: Album**
- Selected images displayed vertically
- AI button (sparkles icon) per image
- Checkbox select with quantity adjuster
- Image count displayed at top

**Features:**
- Package validation (must complete all products)
- Photo frame preview modal on "Add"
- AI Photo Editor modal (see below)
- Single package checkout limitation
- Floating "Checkout Cart" button

**Route:** `/kiosk/shop`

---

### 7. **AI Photo Editor Modal**
Comprehensive AI editing features.

**Gemini AI Section:**
- Describe Image
- Enhance Photo
- Remove Background
- Change Background (with prompt + suggestions)
- Style filters: Ghibli, Pixar 3D, Cartoon, Watercolor, Oil Painting
- Detect Objects
- Custom Edit (with prompt + suggestions)

**AI Editing & Art Studio Section:**
- AI Background Removal (with prompt + suggestions)
- Magic Object Eraser (with prompt + suggestions)
- AI Art Studio (style transformations with prompts)

**Features:**
- Before/after comparison slider
- Real-time processing indicator
- Prompt input with suggestion chips
- "Apply & Save" or "Try Another"

---

### 8. **Cart Summary Page** (`/kiosk/cart`)
Review order and complete payment.

**Features:**
- Order summary with package details
- Quantity and price display
- Discount code input with "Apply" button
- Subtotal, discount, and total calculation
- "Pay Now" button triggers payment modal

**Payment Modal:**
- Three payment methods:
  - **Scan QR Code**: Requires staff ID verification
  - **Card Payment**: Direct card processing
  - **Cash**: Requires staff ID verification
- Staff ID input for QR/Cash methods
- Processing animation
- Success screen with QR code for digital photos

**Route:** `/kiosk/cart`

---

## Photographer UI

### **Photographer Studio** (`/photographer`)
Professional camera interface for staff photographers.

**Features:**
- Live camera feed with grid overlay
- Large "Capture Photo" button
- Session gallery (right sidebar)
  - Thumbnails of all captured photos
  - Select/deselect for upload
  - Individual delete buttons
  - Upload status indicators
- Bulk actions:
  - "Upload All" (all pending photos)
  - "Upload Selected" (selected photos)
- Session statistics (total photos, uploaded count)
- Dark theme for professional photography environment

**Route:** `/photographer`

---

## Shared Components

### Loading Spinner (`<LoadingSpinner />`)
Animated FaceCraft logo with brand messaging.

### Frame Modal (`<PhotoFrameModal />`)
Preview photo in product frame before saving.

### Confirmation Dialogs
Used throughout for delete and update actions.

### Toast Notifications
Success, error, and info messages using shadcn/ui Toast.

---

## Technical Stack

### Core Technologies
- **Next.js 14**: App Router, Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Framer Motion**: Animations and transitions
- **React Webcam**: Camera integration

### Key Dependencies
- `framer-motion`: ^10.18.0
- `react-webcam`: ^7.2.0
- `lucide-react`: ^0.303.0 (icons)
- `@radix-ui/*`: shadcn/ui primitives

---

## File Structure

```
apps/web/src/
├── app/
│   ├── kiosk/
│   │   ├── login/page.tsx          # Staff login
│   │   ├── home/page.tsx           # Kiosk homepage
│   │   ├── capture/page.tsx        # Webcam capture
│   │   ├── select-photos/page.tsx  # Photo selection
│   │   ├── preview/page.tsx        # Photo preview modal
│   │   ├── shop/page.tsx           # Shop/packages page
│   │   └── cart/page.tsx           # Cart & payment
│   ├── photographer/page.tsx       # Photographer UI
│   └── globals.css                 # Responsive kiosk styles
├── components/
│   └── kiosk/
│       ├── loading-spinner.tsx     # Logo loading animation
│       ├── ai-photo-editor-modal.tsx # AI editing features
│       └── photo-frame-modal.tsx   # Frame preview modal
└── hooks/
    └── use-toast.ts                # Toast notifications
```

---

## Responsive Breakpoints

### Standard Screens
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: 1024px - 1920px

### Kiosk Screens (Touch Optimized)
- **21-inch Kiosk**: 1920px+
  - Base font: 18px
  - Touch targets: 48px minimum
  - Generous spacing (2rem)
  - Larger headings and buttons

- **Ultra-wide Kiosk**: 2560px+
  - Base font: 20px
  - Max container: 2400px

### Touch Device Optimizations
- Minimum touch target: 44px
- Larger scrollbars (12px)
- Active states (no hover)
- Scale feedback (0.98 on press)

---

## Key Features Implementation

### Infinite Scroll
Photo selection page automatically loads more photos as user scrolls.

### Multi-Select with Quantity
Album images can be selected with adjustable quantities.

### Package Validation
Ensures all product photo requirements are met before cart addition.

### Single Package Cart
Confirmation prompt if user tries to add a second package without completing the first.

### Frame Preview
Shows how photo will look in the final product before confirming.

### Payment Flow
Three payment methods with staff verification for QR/Cash.

### Receipt with QR Code
Digital photo access via QR code scan.

---

## Animation Patterns

### Page Transitions
- Fade in + slight scale (0.95 → 1)
- Staggered children animations
- Smooth entrance delays

### Interactive Elements
- Hover scale (1.05)
- Active press (0.98)
- Smooth color transitions
- Icon rotations for loading states

### Modal Animations
- Background fade-in (black/80)
- Content scale + fade (0.9 → 1)
- Exit animations on close

---

## Future Enhancements

### Recommended Additions
1. **Real AI Integration**: Connect to actual AI service (Gemini, DALL-E, etc.)
2. **Print Queue**: Physical print management system
3. **Receipt Printing**: Thermal printer integration
4. **Analytics Dashboard**: Track popular packages, conversion rates
5. **Multi-language Support**: i18n for international kiosks
6. **Accessibility**: Enhanced screen reader support, keyboard navigation
7. **Offline Mode**: Service worker for offline functionality

### Backend Integration Points
- User authentication (staff login)
- Photo storage (S3/Cloud Storage)
- Order management
- Payment processing
- AI service APIs
- Print queue management
- Receipt generation

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npx tsc --noEmit --project apps/web

# Build for production
npm run build --workspace=apps/web

# Start production server
npm run start --workspace=apps/web
```

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Safari: Latest 2 versions
- Firefox: Latest 2 versions
- Touch devices: iOS 12+, Android 8+

---

## Performance Considerations

1. **Image Optimization**: All images should use Next.js `<Image />` component
2. **Code Splitting**: Automatic route-based splitting
3. **Lazy Loading**: Components loaded on-demand
4. **Animation Performance**: Hardware-accelerated transforms
5. **Webcam Optimization**: Proper stream cleanup on unmount

---

## Deployment Notes

### Environment Variables Required
```env
NEXT_PUBLIC_API_URL=<your-api-url>
# Add others as needed for AI services, payment gateway, etc.
```

### Build Considerations
- Enable image optimization domain in `next.config.js`
- Configure CORS for camera access
- SSL certificate required for webcam functionality
- Large touch targets for kiosk deployment

---

## Support & Maintenance

### Common Issues
1. **Webcam not working**: Check HTTPS, camera permissions
2. **Touch targets too small**: Verify kiosk media queries applied
3. **Fonts not loading**: Check Google Fonts CDN access
4. **Animations laggy**: Reduce motion for low-end devices

### Monitoring
- Track camera access failures
- Monitor AI API response times
- Log payment gateway errors
- Track package completion rates

---

## Credits

**Design System**: Based on FaceCraft Studio admin dashboard color palette  
**UI Components**: shadcn/ui with custom styling  
**Animations**: Framer Motion  
**Icons**: Lucide React

---

Built with modern web technologies for an exceptional kiosk experience.
