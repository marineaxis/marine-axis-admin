# Marine-Axis Admin Panel

A comprehensive, production-ready admin panel for managing marine services, built with React, TypeScript, and Tailwind CSS.

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8082` (port updated; ensure backend CORS FRONTEND_ORIGIN_ADMIN matches).

## 🎨 Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (Super Admin / Admin)
- Protected routes and API guards
- Input sanitization and validation

### 📊 Dashboard & Analytics
- Overview of key metrics (providers, jobs, blogs)
- Real-time notifications
- Recent activity tracking
- Data export capabilities

### 🏢 Provider Management (Planned UI integration)
- Backend supports approval gating & plan limits

### 💼 Job Management (Implemented)
- Full CRUD (create, edit, delete) via backend
- Status actions: publish, unpublish, close
- Draft creation supported (description or JD file upload)

### 📝 Blog Management (Implemented)
- Create, edit, publish, archive, delete
- Conditional editing UI based on permissions

### ⚙️ Plan & Limits
- Starter plan: max 3 active published jobs (enforced backend)

### ⚙️ Admin Features
- Admin user management (Super Admin only)
- Email template management
- System settings and compliance
- Audit logging

## 🎯 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **State Management**: React Context + Custom Hooks
- **Forms**: React Hook Form + Zod validation

## 🚀 Architecture

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (sidebar, header)
│   └── ui/             # shadcn/ui components
├── context/            # React contexts (Auth, Theme)
├── hooks/              # Custom hooks (CRUD, API)
├── lib/                # Utilities (API client, auth, constants)
├── pages/              # Page components
└── types/              # TypeScript type definitions
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

(Remove any unused legacy variables like VITE_JWT_SECRET if not required by current code.)

### API Integration

The app expects a REST API with endpoints including (see `src/lib/api.ts`):
- `POST /auth/login`
- `GET /jobs` / job action endpoints
- `GET /blogs` / blog action endpoints

## 🎨 Design System

The app features a maritime-inspired design with:

- **Ocean Blue Primary**: Deep, professional blue palette
- **Sea Foam Secondary**: Light, calming accents  
- **Coral Highlights**: Warm accent color for CTAs
- **Responsive Layout**: Mobile-first, fully responsive
- **Dark/Light Themes**: System preference aware

## 🔒 Security Features

- JWT token management with auto-refresh
- Role-based route protection
- Input sanitization and validation
- CORS-ready API client
- Secure password requirements
- Session management

## 🚢 Marine Industry Focus

Built specifically for marine services including:

- Offshore Wind
- Oil & Gas
- Shipping & Logistics
- Marine Engineering
- Naval Architecture
- Port Operations
- Subsea Services
- Maritime Law & Insurance

## 📱 Mobile Support

Fully responsive design with:

- Collapsible sidebar for mobile
- Touch-friendly interface
- Optimized navigation
- Mobile-first approach

## 🔄 Development Workflow

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🌊 Getting Started

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd marine-axis-admin
   npm install
   ```

2. **Set up Environment**
   - Copy `.env.example` (if present) to `.env.local`
   - Set `VITE_API_BASE_URL`

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Create Superadmin (No default credentials are seeded)**
   - Generate bcrypt hash:
     ```bash
     node -e "console.log(require('bcryptjs').hashSync('ReplaceWithSecurePwd', 10))"
     ```
   - In MongoDB `users` collection insert (adjust fields as backend schema requires):
     ```js
     db.users.insertOne({
       email: 'superadmin@marine-axis.com',
       password: '<bcrypt-hash>',
       role: 'superadmin',
       approved: true,
       createdAt: new Date(),
       updatedAt: new Date()
     })
     ```
   - Login with the created email/password.

## 🔮 Roadmap

- Provider CRUD UI
- Confirmation dialogs for destructive actions
- Advanced analytics & notifications

## 📄 License

Proprietary software for Marine-Axis.

---
Built with ❤️ for the marine industry