# 🔒 MARKETSAGE ADMIN PORTAL - SECURITY POLICY

**Last Updated**: 2025-10-08
**Version**: 1.0.0

---

## ⚠️ CRITICAL: ACCESS RESTRICTION

The MarketSage Admin Portal is **EXCLUSIVELY** for MarketSage staff members.

### Access Requirements

#### 1. Email Domain Restriction
- ✅ **REQUIRED**: `@marketsage.africa` email domain
- ❌ **BLOCKED**: All other email domains (including customer emails)

#### 2. Role Requirements
- ✅ **ALLOWED ROLES**:
  - `SUPER_ADMIN` - Full system access
  - `IT_ADMIN` - Technical administration and system management
  - `ADMIN` - Business operations and user management

- ❌ **BLOCKED ROLES**:
  - `USER` - Regular customer users
  - `AI_AGENT` - Automated system agents

#### 3. Organization Requirement
- ✅ **REQUIRED**: Must be part of "MarketSage Internal" organization
- ❌ **BLOCKED**: Customer organization members

---

## 🛡️ Security Implementation

### Backend Protection

#### AdminPortalGuard
Location: `/Users/supreme/Desktop/marketsage-backend/src/auth/guards/admin-portal.guard.ts`

This guard enforces:
1. User must be authenticated (JWT token)
2. Email must end with `@marketsage.africa`
3. Role must be `SUPER_ADMIN`, `IT_ADMIN`, or `ADMIN`

**Usage Example:**
```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPortalGuard)
export class AdminController {
  // All routes in this controller are protected
}
```

#### Authentication Flow
1. User attempts to login via `/api/v2/auth/login`
2. Backend validates credentials
3. Backend checks if user is suspended (`isSuspended` flag)
4. Backend validates email domain and role
5. JWT token generated if all checks pass
6. Frontend stores token in localStorage
7. All API requests include JWT in Authorization header
8. AdminPortalGuard validates each protected request

---

## 👥 Authorized Staff Accounts

### Current Staff Members

| Email | Role | Organization | Status |
|-------|------|--------------|--------|
| admin@marketsage.africa | SUPER_ADMIN | MarketSage Internal | Active |
| supreme@marketsage.africa | SUPER_ADMIN | MarketSage Internal | Active |
| anita@marketsage.africa | ADMIN | MarketSage Internal | Active |
| kola@marketsage.africa | IT_ADMIN | MarketSage Internal | Active |

### Creating New Admin Users

**IMPORTANT**: Use the dedicated admin creation script:

```bash
cd /Users/supreme/Desktop/marketsage-backend
npm run create-admin
```

This script:
- Creates "MarketSage Internal" organization (if not exists)
- Creates user with specified admin role
- Enforces @marketsage.africa email domain
- Sets proper organizationId

**DO NOT** use the regular registration endpoint for admin users.

---

## 🚨 Security Violations

### Blocked Actions

The following actions are automatically blocked:

1. **Customer Login Attempts**
   - Any email not ending with @marketsage.africa
   - Returns: `401 Unauthorized`
   - Error: "Admin portal access is restricted to MarketSage staff members only"

2. **Insufficient Role**
   - Users with USER or AI_AGENT role
   - Returns: `401 Unauthorized`
   - Error: "Insufficient permissions. Admin portal requires SUPER_ADMIN, IT_ADMIN, ADMIN role"

3. **Suspended User Login**
   - Users with `isSuspended: true`
   - Returns: `401 Unauthorized`
   - Error: "Your account has been suspended. Please contact support for assistance"

### Audit Logging

All admin portal access attempts are logged:
- Successful logins
- Failed login attempts
- Unauthorized access attempts
- Role/email validation failures

Logs can be viewed in:
- Backend console output
- Database audit_logs table (when implemented)
- Admin portal Audit Logs section

---

## 🔐 Additional Security Measures

### 1. Rate Limiting
- Login attempts: 5 per 15 minutes
- Registration attempts: 3 per hour
- API requests: Configurable per endpoint

### 2. JWT Token Security
- Expiration: 24 hours
- Algorithm: HS256
- Payload includes: userId, email, role, organizationId
- Stored in localStorage (frontend)

### 3. Password Requirements
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special character
- Hashed using bcrypt (10 rounds)

### 4. Account Lockout
- Failed login attempts tracked
- Lockout after 5 failed attempts
- Lockout duration: Configurable (default: 15 minutes)

---

## 📋 Compliance & Best Practices

### Data Protection
- All API communications over HTTPS (production)
- Sensitive data encrypted at rest
- JWT tokens transmitted securely
- No sensitive data in logs

### Access Control
- Principle of least privilege
- Role-based access control (RBAC)
- Regular access reviews
- Immediate revocation for departing staff

### Monitoring
- Real-time access monitoring
- Anomaly detection (planned)
- Security alerts (planned)
- Regular security audits

---

## 🆘 Security Incident Response

### Suspected Breach
1. Immediately rotate all JWT secrets
2. Force logout all users
3. Review audit logs
4. Investigate access patterns
5. Notify security team

### Compromised Account
1. Suspend user account immediately
2. Revoke all active sessions
3. Reset password
4. Review recent activity
5. Notify user

### Emergency Contacts
- Security Team: security@marketsage.africa
- System Admin: admin@marketsage.africa
- CTO: cto@marketsage.africa

---

## 📝 Change Log

### Version 1.0.0 (2025-10-08)
- Initial security policy created
- AdminPortalGuard implemented
- Email domain validation added
- Role-based access control documented
- Suspended user login prevention added
