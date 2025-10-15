# MarketSage Admin Portal

**Enterprise Staff Portal for Platform Management**

> Pure UI layer with ZERO database access - All data operations via backend API

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐
│   Admin Portal (Port 3001)      │  Pure UI Layer
│   admin.marketsage.africa       │  
│                                 │  ✅ React Components
│   NO DATABASE ACCESS            │  ✅ API Calls Only
│   NO PRISMA CLIENT              │  ✅ React Query
└────────────┬────────────────────┘
             │
             │ HTTPS REST API
             │
             ▼
┌─────────────────────────────────┐
│   NestJS Backend (Port 3006)    │  Single Source of Truth
│   api.marketsage.africa         │
│                                 │  ✅ Prisma ORM
│   ALL DATABASE ACCESS           │  ✅ Business Logic
└────────────┬────────────────────┘  ✅ Multi-tenancy
             │                       ✅ Role Guards
             ▼
       ┌──────────┐
       │PostgreSQL│
       └──────────┘
```

## 🎯 Purpose

The **MarketSage Admin Portal** is a separate application for MarketSage staff to:
- Manage all client organizations
- Monitor platform-wide analytics
- Handle billing and subscriptions
- Review security events and incidents
- Manage user accounts across organizations
- Access system health and performance metrics

## ✨ Key Features

### 1. Organization Management
- View all client organizations
- Monitor subscription status and billing
- Track usage metrics (campaigns, contacts, users)
- Suspend/activate organizations
- View organization-specific analytics

### 2. User Management
- View users across all organizations
- Manage user roles and permissions
- Suspend/activate user accounts
- Track user activity and sessions

### 3. Platform Analytics
- System-wide performance metrics
- Revenue and billing analytics
- User growth and engagement trends
- Campaign performance across clients

### 4. Security & Compliance
- Security event monitoring
- Threat detection and response
- Access log review
- GDPR compliance tracking

### 5. System Management
- Infrastructure health monitoring
- Service status dashboard
- Performance metrics
- Database and cache statistics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Access to MarketSage backend API (running on port 3006)
- Staff email from `@marketsage.africa` domain

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The admin portal will be available at:
- **Development**: http://localhost:3001
- **Production**: https://admin.marketsage.africa

### Environment Configuration

See `.env.local` for configuration. Key variables:

```bash
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:3006
NEXT_PUBLIC_API_URL=http://127.0.0.1:3006/api/v2

# Admin Portal
PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Authentication
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here

# Staff Configuration
ADMIN_STAFF_EMAILS=admin@marketsage.africa,support@marketsage.africa
ADMIN_STAFF_DOMAINS=marketsage.africa

# NO DATABASE CONFIGURATION
# This admin portal is a pure UI layer
```

## 🔐 Authentication

### Staff Access Only

The admin portal is restricted to MarketSage staff members:

1. **Email Whitelist**: Only emails from `@marketsage.africa` domain
2. **Role-Based Access**: ADMIN, SUPER_ADMIN, IT_ADMIN roles
3. **Backend Authentication**: All auth handled by NestJS backend

### Login Flow

1. Navigate to `/admin-login`
2. Enter staff credentials
3. Backend validates and returns JWT token
4. Token stored in NextAuth session
5. All API requests include JWT in Authorization header

## 📁 Project Structure

```
marketsage-admin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin pages (14 sections)
│   │   │   ├── dashboard/      # System overview
│   │   │   ├── organizations/  # Organization management
│   │   │   ├── users/          # User management
│   │   │   ├── analytics/      # Platform analytics
│   │   │   ├── billing/        # Billing & subscriptions
│   │   │   ├── security/       # Security monitoring
│   │   │   ├── audit/          # Audit logs
│   │   │   ├── support/        # Support tickets
│   │   │   ├── incidents/      # Incident management
│   │   │   ├── messages/       # Message queues
│   │   │   ├── system/         # System health
│   │   │   ├── settings/       # Admin settings
│   │   │   ├── ai/             # AI monitoring
│   │   │   └── campaigns/      # Campaign overview
│   │   ├── admin-login/        # Staff login page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page (redirects)
│   ├── components/             # React components
│   │   ├── admin/              # Admin-specific components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Utility libraries
│   │   ├── api/                # API client & hooks
│   │   │   ├── client.ts       # HTTP client (NO Prisma)
│   │   │   └── hooks/          # React Query hooks
│   │   ├── auth/               # Authentication utilities
│   │   └── admin-config.ts     # Admin configuration
│   └── types/                  # TypeScript definitions
├── .env.local                  # Environment config (NO DATABASE_URL)
├── package.json                # Dependencies (NO @prisma/client)
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Frontend Framework
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library

### State & Data Management
- **React Query** - Server state management
- **Axios** - HTTP client for API calls
- **NextAuth** - Authentication

### UI Components
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations
- **Lucide Icons** - Icon library
- **Recharts** - Data visualization

### NO DATABASE Dependencies
- ❌ NO @prisma/client
- ❌ NO direct database access
- ❌ NO DATABASE_URL in environment
- ✅ Pure UI layer architecture

## 🔌 API Integration

All data access goes through the NestJS backend:

```typescript
// Example: Fetching organizations
const apiClient = useApiClient();
const response = await apiClient.get('/admin/organizations');
```

### API Hooks

Pre-built hooks for common operations:

```typescript
import { useAdminOrganizations } from '@/lib/api/hooks/useAdminOrganizations';

function OrganizationsPage() {
  const { organizations, loading, error } = useAdminOrganizations({
    page: 1,
    limit: 10
  });
  
  // Render organizations...
}
```

### Available Hooks
- `useAdminOrganizations` - Organization management
- `useAdminUsers` - User management
- `useAdminAnalytics` - Platform analytics
- `useAdminSecurity` - Security monitoring
- `useAdminAudit` - Audit logs
- `useAdminBilling` - Billing data
- `useAdminSupport` - Support tickets
- `useAdminIncidents` - Incident tracking
- `useAdminMessages` - Message queues
- `useAdminSystem` - System health
- `useAdminSettings` - Settings management
- `useAdminAI` - AI system monitoring

## 🔒 Security

### Principles

1. **Zero Trust**: No direct database access
2. **Backend Validation**: All operations validated by backend
3. **JWT Authentication**: Token-based auth with expiry
4. **Role-Based Access**: Granular permissions
5. **Audit Logging**: All actions logged

### Security Features

- HTTPS-only in production
- Secure session management
- CSRF protection
- Rate limiting (via backend)
- IP whitelisting (optional)
- 2FA support (configured via backend)

## 📊 Monitoring

The admin portal includes:

- Real-time system metrics
- Platform-wide analytics
- User activity monitoring
- Campaign performance tracking
- Security event monitoring
- Infrastructure health checks

## 🚢 Deployment

### Development

```bash
npm run dev
```

Runs on http://localhost:3001

### Production

```bash
npm run build
npm start
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3001
CMD ["node", "server.js"]
```

### Environment Variables

Required in production:
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL
- `NEXTAUTH_URL` - Admin portal URL
- `NEXTAUTH_SECRET` - Secret for session encryption
- `ADMIN_STAFF_EMAILS` - Comma-separated staff emails

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Development Guidelines

### Adding New Admin Features

1. Create page in `src/app/admin/[feature]/page.tsx`
2. Create API hook in `src/lib/api/hooks/useAdmin[Feature].ts`
3. Use API client (NO direct DB access)
4. Add navigation link in admin layout
5. Test with staff account

### Code Style

- Use TypeScript strict mode
- Follow existing component patterns
- Use React Query for data fetching
- Implement proper error handling
- Add loading states

## 🔗 Related Projects

- **marketsage-backend** - NestJS API (port 3006)
- **marketsage-frontend** - Client application (port 3000)
- **marketsage-monitoring** - Observability stack

## 📄 License

Proprietary - MarketSage Platform

---

## 🎯 Architecture Highlights

### ✅ What This Portal HAS

- Pure UI components
- API client with authentication
- React Query for data fetching
- NextAuth for session management
- Tailwind CSS for styling

### ❌ What This Portal DOES NOT Have

- Prisma client
- Direct database connections
- Business logic
- Data validation (handled by backend)
- Multi-tenancy logic (handled by backend)

This separation ensures:
- **Security**: Admin portal can't bypass backend security
- **Scalability**: Add mobile admin app by reusing API
- **Maintainability**: Single source of truth for business logic
- **Auditability**: All DB operations logged in one place

---

**Built with ❤️ by MarketSage Engineering Team**
