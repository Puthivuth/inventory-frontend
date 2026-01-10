# Inventory Management System - Frontend

Modern Next.js frontend for the Inventory Management System with a clean, responsive UI.

## Features

- **Dashboard**: Real-time analytics and insights
- **Inventory Management**: Add, edit, and track inventory
- **Invoice Management**: Create and manage invoices with KHQR payment
- **Purchase Orders**: Create and track purchase orders
- **Supplier Management**: Manage supplier information
- **Customer Management**: Track customer data
- **User Authentication**: JWT-based authentication
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Authentication**: JWT tokens

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Backend API running (see backend README)

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd inventory-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file:
   ```bash
   cp .env.production.example .env.local
   ```

   Update the values:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Production Build

### Build for production

```bash
npm run build
npm start
```

### Environment Variables for Production

Create `.env.production.local`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_BACKEND_DOMAIN=api.yourdomain.com
NODE_ENV=production
```

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Set environment variables
   - Deploy

3. **Environment Variables in Vercel**
   - Add `NEXT_PUBLIC_API_URL` with your production API URL

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t inventory-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api inventory-frontend
```

### Nginx Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Start with PM2**
   ```bash
   pm2 start npm --name "inventory-frontend" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Project Structure

```
inventory-frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── inventory/         # Inventory pages
│   ├── invoices/          # Invoice pages
│   ├── suppliers/         # Supplier pages
│   └── customers/         # Customer pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth components
│   ├── dashboard/        # Dashboard components
│   ├── inventory/        # Inventory components
│   ├── invoice/          # Invoice components
│   └── navigation/       # Navigation components
├── lib/                   # Utility functions
│   ├── api.ts            # API client
│   ├── utils.ts          # Utility functions
│   └── permissions.ts    # Permission checks
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── public/               # Static assets
└── styles/               # Global styles
```

## Key Features

### Dashboard
- Sales performance metrics
- Inventory health monitoring
- Revenue charts
- Low stock alerts
- Recent activity log
- Top products analytics

### Inventory Management
- Add/Edit/Delete products
- Stock tracking
- Image upload
- Category management
- Search and filter

### Invoice Management
- Create invoices
- KHQR payment integration
- PDF generation
- Payment tracking
- Invoice preview

### Purchase Orders
- Create purchase orders
- Supplier selection
- Item management
- Status tracking
- Invoice generation

### User Management
- Role-based access control
- User profiles
- Authentication
- Permission management

## API Integration

The frontend communicates with the Django backend via REST API:

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Authentication
export async function login(email: string, password: string)
export async function register(userData: RegisterData)
export async function refreshToken()

// Inventory
export async function getInventory()
export async function createProduct(productData: ProductData)

// Invoices
export async function getInvoices()
export async function createInvoice(invoiceData: InvoiceData)
export async function generateKHQR(invoiceId: string)
```

## Styling

### Tailwind CSS Configuration

Custom colors and themes are configured in `tailwind.config.js`. The project uses CSS variables for theming, allowing easy light/dark mode switching.

### Component Library

Built on top of **shadcn/ui** and **Radix UI** for accessible, composable components:
- Dialog
- DropdownMenu
- Select
- Table
- Form
- Toast notifications
- And more...

## Authentication Flow

1. User logs in via `/auth/login`
2. Backend returns JWT access and refresh tokens
3. Tokens stored in localStorage
4. Access token sent with each API request
5. Automatic token refresh when expired
6. Redirect to login if refresh fails

## Environment Variables

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Production
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_BACKEND_DOMAIN=api.yourdomain.com
NODE_ENV=production
```

## Troubleshooting

### Common Issues

1. **API connection errors**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check backend is running
   - Verify CORS settings in backend

2. **Authentication errors**
   - Clear localStorage
   - Check token expiration
   - Verify JWT secret matches backend

3. **Build errors**
   - Delete `.next` folder
   - Delete `node_modules`
   - Run `npm install` again
   - Try `npm run build` again

4. **Image loading issues**
   - Check image paths in `next.config.mjs`
   - Verify backend URL for images
   - Check CORS for image domain

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Performance Optimization

- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic with Next.js
- **Lazy Loading**: Components loaded on demand
- **Caching**: API responses cached where appropriate
- **Server Components**: Used where possible for better performance

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact the development team.
