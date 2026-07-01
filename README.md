# PSCCHC Asset & IP Management System

> Enterprise-grade IT asset and IP address management system for **Port Said Container & Cargo Handling Company**

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        NGINX (Port 80)                            │
│                  Reverse Proxy + Static Files                     │
├───────────────────────────┬──────────────────────────────────────┤
│   React Frontend          │   Express REST API + Socket.IO        │
│   (Vite + TypeScript)     │   (Port 3001)                        │
│   Tailwind CSS             │   JWT Authentication                  │
│   Recharts                │   Prisma ORM                         │
│   socket.io-client        │   ICMP Ping Monitor Service          │
│   sonner (toast UI)       │                                      │
├───────────────────────────┴──────────────────────────────────────┤
│                    PostgreSQL (Port 5432)                         │
│           15+ Tables, Indexed, UUID Primary Keys                  │
└──────────────────────────────────────────────────────────────────┘
```

### Real-Time Data Flow

```
DeviceMonitor (server)
  │  ICMP ping every 30s (normal) / 10s (critical)
  ▼
Socket.IO  ──── device:status-batch ────►  WebSocketContext (client)
               device:status-update          │
               notification:new              ├── DevicesPage   (live ping dot, response time)
               monitor:config                ├── DashboardPage (live online/offline counts)
                                             └── NotificationsPage (real-time alerts)
```

---

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

### 2. Full Stack (With Database + WebSocket Monitoring)

```bash
# Start PostgreSQL (or use Docker)
docker run -d --name pscchc-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=pscchc_ipam \
  -p 5432:5432 postgres:16-alpine

# Setup backend
cd server
npm install
cp .env.example .env     # Edit DATABASE_URL if needed
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev              # API + Socket.IO on :3001

# In another terminal
cd client
npm run dev              # Vite dev server on :5173
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

---

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pscchc.com | admin123 |
| IT Manager | it.manager@pscchc.com | admin123 |
| IT Support | it.support@pscchc.com | admin123 |
| Read Only | viewer@pscchc.com | admin123 |

---

## 📁 Project Structure

```
├── client/                        # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/            # Sidebar, Header, MainLayout
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx    # JWT login/logout
│   │   │   ├── ThemeContext.tsx   # Dark/Light theme
│   │   │   ├── NotificationContext.tsx
│   │   │   └── WebSocketContext.tsx  # Socket.IO + ping state
│   │   ├── lib/                   # Utils, constants, mock data
│   │   ├── pages/                 # Route-level pages (9 total)
│   │   └── types/                 # Shared TypeScript interfaces
│   └── vite.config.ts
│
├── server/                        # Node.js + Express Backend
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT authenticate + authorize
│   │   │   └── socketAuth.ts     # Socket.IO JWT handshake
│   │   ├── routes/               # 13 REST route modules
│   │   │   ├── auth.ts, users.ts, devices.ts
│   │   │   ├── ipAddresses.ts, vlans.ts
│   │   │   ├── branches.ts, departments.ts, employees.ts
│   │   │   ├── auditLogs.ts, notifications.ts
│   │   │   ├── reports.ts, categories.ts
│   │   │   └── monitor.ts        # Ping status REST endpoints
│   │   ├── services/
│   │   │   └── deviceMonitor.ts  # ICMP ping engine (core service)
│   │   └── utils/                # Prisma client, helpers
│   └── prisma/
│       ├── schema.prisma          # 15-table DB schema
│       └── seed.ts                # Seed data
│
├── docker-compose.yml
├── Dockerfile.client
├── Dockerfile.server
└── README.md
```

---

## 📊 Features

### Dashboard
- Real-time device statistics — **live-updated via WebSocket** (Total, Online, Offline, Maintenance)
- Device distribution pie chart (Recharts)
- IP utilization by VLAN bar chart
- Recently added devices table with detail drill-down
- Live connectivity event feed (status changes stream in real time)
- System health indicators

### Device Management
- Full CRUD with **11 device categories** (Router, Switch, Core Switch, Server, PC, Laptop, Fingerprint, Camera, Firewall, IP Phone, Access Point)
- Multi-tab form: **General · Network · Location · Responsibility · Security**
- Full-page add/edit form with tabbed layout (same page as detail view)
- Advanced search & filtering by category, status, and branch
- **Live ping indicator** on each device row — colored dot + response time (ms)
- **On-demand Ping button** in device detail view
- **Live Connectivity panel** showing reachability, response time, last seen online, consecutive failures
- **Toast notifications** for add, update, and delete actions

### IP Address Management (IPAM)
- Full-page **Add IP / Edit IP** form (same pattern as Device Manager — no modal)
- **Edit button** per IP row in addition to delete
- IP address table with status tracking (Assigned / Available / Reserved / Duplicate)
- VLAN management with CRUD (modal form)
- Visual **IP Range Map** — color-coded 16×N grid per VLAN
- **Duplicate IP detection** with alert banner
- **IP Availability Checker** — instant lookup by address
- **Toast notifications** for all IP and VLAN CRUD operations

### Reports
- 6 report types: Inventory, Asset, IP Allocation, Maintenance, Warranty, Category Summary
- Export to **CSV**, **Excel (.xlsx)**, and **Print / PDF**
- Filterable by date range

### Audit Logs
- Complete activity tracking — all CREATE / UPDATE / DELETE actions
- System-generated entries for ping-triggered status changes
- Filterable by action type, entity type, and user
- Previous/new value diff display

### User Management
- RBAC roles: **Admin, IT Manager, IT Support, Read Only**
- User cards with avatar initials, status, role, and last login
- Add / Edit / Activate / Deactivate / Delete with **toast feedback**

### Notifications
- Real-time push via **Socket.IO** (`notification:new` event)
- 5 types: Duplicate IP, Warranty Expiry, Device Offline, Maintenance Due, Security Alert
- 4 severity levels: info · warning · error · **critical**
- **Audio alarm** for critical device failures (Web Audio API — configurable)
- Mark as read / Mark all read / Delete

### Settings
- **Dark / Light theme** toggle with toast confirmation
- **Device Monitoring** panel:
  - Enable / Disable ping engine at runtime
  - Configurable intervals: normal devices (default 30 s), critical infrastructure (default 10 s)
  - Configurable ping timeout and retry count
  - **Sound alerts toggle** (persisted in localStorage)
  - Live WebSocket connection status indicator
- Branches & Locations management (add/delete with toasts)
- Departments management (add/delete with toasts)
- VLAN configuration (add/delete with toasts)

---

## 🔌 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `device:status-batch` | Server → Client | Full status map on connect |
| `device:status-update` | Server → Client | Single device ping result |
| `device:request-ping` | Client → Server | Trigger on-demand ping |
| `notification:new` | Server → Client | New notification (with `playSound` flag) |
| `monitor:config` | Server → Client | Current ping config on connect |
| `monitor:config-updated` | Server → Client | Config changed broadcast |
| `monitor:update-config` | Client → Server | Update config from Settings UI |

**Connection:** Authenticated via JWT passed in Socket.IO handshake `auth.token`.  
**Transport:** WebSocket with polling fallback. Auto-reconnect with exponential back-off.

---

## 🔌 REST API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | User login, returns JWT |
| POST | `/api/auth/logout` | ✓ | Logout |
| POST | `/api/auth/reset-password` | ✓ | Password reset |
| GET/POST | `/api/users` | Admin | List / Create users |
| PUT/DELETE | `/api/users/:id` | Admin | Update / Delete user |
| GET | `/api/devices` | ✓ | List devices (search, filter, paginate) |
| GET | `/api/devices/stats` | ✓ | Dashboard statistics |
| GET/POST | `/api/devices/:id` | ✓/IT+ | Get / Create device |
| PUT/DELETE | `/api/devices/:id` | IT+ | Update / Delete device |
| GET/POST | `/api/ip-addresses` | ✓ | List / Add IPs |
| GET | `/api/ip-addresses/duplicates` | ✓ | Detect duplicates |
| GET | `/api/ip-addresses/available` | ✓ | Check availability |
| GET/POST | `/api/vlans` | ✓ | List / Create VLANs |
| GET | `/api/audit-logs` | ✓ | Activity log |
| GET | `/api/notifications` | ✓ | List notifications |
| PUT | `/api/notifications/:id/read` | ✓ | Mark as read |
| GET | `/api/reports/:type` | ✓ | Generate report |
| GET/POST | `/api/branches` | ✓ | Branches |
| GET/POST | `/api/departments` | ✓ | Departments |
| GET/POST | `/api/employees` | ✓ | Employees |
| GET/POST | `/api/categories` | ✓ | Device categories |
| GET | `/api/monitor/status` | ✓ | Full ping status map |
| GET | `/api/monitor/config` | ✓ | Monitor configuration |
| PUT | `/api/monitor/config` | Admin/IT Mgr | Update ping config |
| POST | `/api/monitor/ping/:deviceId` | ✓ | On-demand device ping |
| POST | `/api/monitor/refresh` | Admin/IT Mgr | Reload device list |
| GET | `/api/health` | — | Health check |

**Swagger Docs:** http://localhost:3001/api-docs

---

## 🏓 Device Monitor Service

The `DeviceMonitorService` (`server/src/services/deviceMonitor.ts`) is the core real-time engine:

- **Two-tier ping schedule:** critical infrastructure (Core Switch, Firewall, Router, Switch, AP) pings every **10 s**; all other devices every **30 s**
- **Batch concurrency:** pings up to 20 devices simultaneously to avoid network flooding
- **Retry logic:** configurable number of ICMP retries before marking unreachable
- **Auto status toggling:** automatically transitions device status `Online ↔ Offline` in the database when reachability changes (only for devices with `monitoringExcluded = false`)
- **Audit trail:** every ping-triggered status change creates an `AuditLog` record with `source: ping-monitor`
- **Push notifications:** creates a `Notification` row + instantly pushes `notification:new` via Socket.IO
- **On-demand ping:** responds to `device:request-ping` socket events within the current session
- **Runtime reconfiguration:** accepts `monitor:update-config` without server restart
- **DB persistence:** stores `lastPingAt`, `lastSeenOnline`, `pingResponseMs`, `isReachable` per device

---

## 🔒 Security

- JWT authentication with configurable expiration (`JWT_EXPIRES_IN`)
- bcrypt password hashing (12 rounds)
- RBAC middleware on all routes (`Admin > IT Manager > IT Support > Read Only`)
- Socket.IO authenticated via JWT handshake middleware (`socketAuth.ts`)
- CORS configuration (origin-restricted)
- Input validation with Zod
- SQL injection prevention via Prisma ORM (parameterized queries)
- XSS prevention via React (no `dangerouslySetInnerHTML`)
- Security headers via Nginx in production

---

## 🗄 Database Schema (PostgreSQL via Prisma)

| Table | Key Fields |
|-------|-----------|
| `users` | id, username, email, password_hash, role_id, is_active |
| `roles` | id, name, permissions (JSON) |
| `devices` | id, device_name, asset_tag, category_id, status, ip_address, last_ping_at, is_reachable, ping_response_ms |
| `device_categories` | id, name, icon, color |
| `ip_addresses` | id, ip_address, device_id, vlan_id, status, type |
| `vlans` | id, vlan_number, name, subnet, gateway |
| `branches` | id, name, address, city |
| `departments` | id, name, branch_id |
| `employees` | id, full_name, employee_code, department_id |
| `audit_logs` | id, user_id, action, entity_type, entity_id, previous_value, new_value |
| `notifications` | id, type, severity, title, message, is_read, reference_id |
| `maintenance_records` | id, device_id, type, status, scheduled_date |
| `warranty_records` | id, device_id, provider, start_date, end_date |

---

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `secret` | JWT signing secret (change in production!) |
| `JWT_EXPIRES_IN` | `24h` | Token expiration |
| `PORT` | `3001` | HTTP + WebSocket port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `PING_INTERVAL_MS` | `30000` | Normal device ping interval |
| `PING_CRITICAL_INTERVAL_MS` | `10000` | Critical device ping interval |
| `PING_TIMEOUT_S` | `2` | ICMP ping timeout (seconds) |
| `PING_RETRIES` | `2` | Ping retries before marking offline |

### Client (`client/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend API + Socket.IO URL |

---

## 📈 Future Roadmap

- SNMP/auto-discovery for zero-touch device onboarding
- Active Directory / LDAP authentication integration
- Multi-tenancy for branch isolation
- Redis caching for dashboard statistics
- Elasticsearch for full-text search across all entities
- Automated backup scheduling with email reports
- Mobile-responsive PWA mode
