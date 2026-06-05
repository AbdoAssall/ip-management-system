# PSCCHC Asset & IP Management System

> Enterprise-grade IT asset and IP address management system for **Port Said Container & Cargo Handling Company**

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Port 80)                       │
│              Reverse Proxy + Static Files                │
├─────────────────────┬───────────────────────────────────┤
│   React Frontend    │      Express REST API             │
│   (Vite + TS)       │      (Port 3001)                  │
│   Tailwind CSS      │      JWT Authentication           │
│   Recharts          │      Prisma ORM                   │
├─────────────────────┴───────────────────────────────────┤
│               PostgreSQL (Port 5432)                     │
│               13+ Tables, Indexed                        │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### 1. Frontend Only (Mock Data)

```bash
cd client
npm install
npm run dev
# Open http://localhost:5173
# Login: admin@pscchc.com (any password)
```

### 2. Full Stack (With Database)

```bash
# Start PostgreSQL (or use Docker)
docker run -d --name pscchc-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=pscchc_ipam -p 5432:5432 postgres:16-alpine

# Setup backend
cd server
npm install
cp .env.example .env  # Edit DATABASE_URL if needed
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev

# In another terminal
cd client
npm run dev
```

### 3. Docker Deployment

```bash
# From project root
docker-compose up -d --build

# Run migrations & seed
docker-compose exec server npx prisma migrate deploy
docker-compose exec server npx tsx prisma/seed.ts

# Access at http://localhost
```

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pscchc.com | admin123 |
| IT Manager | it.manager@pscchc.com | admin123 |
| IT Support | it.support@pscchc.com | admin123 |
| Read Only | viewer@pscchc.com | admin123 |

## 📁 Project Structure

```
├── client/                  # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   └── layout/      # Sidebar, Header, MainLayout
│   │   ├── contexts/        # Auth, Theme, Notifications
│   │   ├── lib/             # Utils, constants, mock data
│   │   ├── pages/           # Route pages
│   │   └── types/           # TypeScript interfaces
│   └── vite.config.ts
├── server/                  # Node.js + Express Backend
│   ├── src/
│   │   ├── middleware/       # JWT auth, RBAC
│   │   ├── routes/           # REST API endpoints
│   │   └── utils/            # Prisma client
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── seed.ts           # Seed data
├── docker-compose.yml
├── Dockerfile.client
├── Dockerfile.server
└── README.md
```

## 📊 Features

### Dashboard
- Real-time statistics (Total, Online, Offline devices)
- Device distribution pie chart
- IP utilization by VLAN bar chart
- Recently added devices table
- System health indicators

### Device Management
- Full CRUD with 11 device categories
- Multi-tab form (General, Network, Location, Person, Security)
- Advanced search & filtering
- Detail view modal

### IP Address Management (IPAM)
- IP address table with status tracking
- VLAN management with CRUD
- Visual IP range map (color-coded grid)
- Duplicate IP detection
- IP availability checker

### Reports
- 6 report types (Inventory, Asset, IP, Maintenance, Warranty, Category)
- Export to CSV, Excel, and PDF/Print

### Audit Logs
- Complete activity tracking
- Filterable by action, entity, and user
- Previous/new value diff display

### User Management
- RBAC (Admin, IT Manager, IT Support, Read Only)
- User cards with status and role info

### Notifications
- Duplicate IP alerts
- Warranty expiration warnings
- Device offline notifications
- Maintenance due reminders
- Security alerts

### Settings
- Dark/Light theme toggle
- Branches & Locations management
- Departments management
- VLAN configuration

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| POST | /api/auth/reset-password | Password reset |
| GET/POST | /api/users | List / Create users |
| PUT/DELETE | /api/users/:id | Update / Delete user |
| GET | /api/devices | List devices (filterable) |
| GET | /api/devices/stats | Dashboard statistics |
| GET/POST | /api/devices/:id | Get / Create device |
| PUT/DELETE | /api/devices/:id | Update / Delete device |
| GET/POST | /api/ip-addresses | List / Add IPs |
| GET | /api/ip-addresses/duplicates | Detect duplicates |
| GET | /api/ip-addresses/available | Check availability |
| GET/POST | /api/vlans | List / Create VLANs |
| GET | /api/audit-logs | List audit logs |
| GET | /api/notifications | List notifications |
| PUT | /api/notifications/:id/read | Mark as read |
| GET | /api/reports/:type | Generate report |
| GET/POST | /api/branches | List / Create branches |
| GET/POST | /api/departments | List / Create departments |
| GET/POST | /api/employees | List / Create employees |

**Swagger Docs:** http://localhost:3001/api-docs

## 🔒 Security

- JWT authentication with token expiration
- bcrypt password hashing (12 rounds)
- RBAC middleware on all routes
- CORS configuration
- Input validation with Zod
- SQL injection prevention via Prisma ORM
- XSS prevention via React
- Security headers via Nginx

## 📈 Future Scalability

- WebSocket for real-time device status
- SNMP/ping integration for auto-discovery
- Active Directory / LDAP integration
- Multi-tenancy for branch isolation
- Redis caching for dashboard stats
- Elasticsearch for full-text search
- Automated backup scheduling
