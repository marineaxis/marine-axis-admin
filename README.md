# Marine-Axis Admin Panel

A comprehensive, production-ready admin panel for managing marine services, built with React, TypeScript, and Tailwind CSS.

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

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

### 🏢 Provider Management
- Full CRUD operations for marine service providers
- Approval workflow for provider registrations
- Featured provider management
- Email notifications (Resend integration ready)

### 💼 Job Management
- Job posting creation and management
- Status tracking (draft, published, closed)
- Category-based organization
- Location and salary range filtering

### 📝 Content Management
- Blog post creation with rich content
- SEO metadata management
- Draft/publish workflow
- Image upload support

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
VITE_JWT_SECRET=your-jwt-secret-key
```

### API Integration

The app expects a REST API with the following endpoints:

- `POST /auth/login` - User authentication
- `GET /analytics/dashboard` - Dashboard metrics
- `GET /providers` - Provider listings
- `GET /jobs` - Job listings
- `GET /approvals` - Pending approvals

See `src/lib/api.ts` for complete API structure.

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
   - Copy `.env.example` to `.env.local`
   - Configure API endpoint
   - Set JWT secret

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Default Login** (when connected to backend)
   - Email: `admin@marine-axis.com`
   - Password: `password123`

## 🔮 Roadmap

- [ ] Advanced analytics with charts
- [ ] Real-time notifications via WebSocket
- [ ] File upload with drag-and-drop
- [ ] Advanced filtering and search
- [ ] Email template visual editor
- [ ] Multi-language support
- [ ] Advanced audit logging
- [ ] API rate limiting
- [ ] Two-factor authentication

## 📄 License

This project is proprietary software for Marine-Axis.

---

Built with ❤️ for the marine industry