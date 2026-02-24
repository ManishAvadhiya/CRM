# CRM Frontend Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Backend API running on http://localhost:5000

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Additional UI Dependencies
```bash
npm install tailwindcss-animate
npm install -D @types/node
```

### 3. Create Environment File
Create `.env` file in the root:
```
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Development Server
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Default Login Credentials
- Email: admin@crm.com
- Password: Admin@123

## Project Structure
```
src/
├── components/
│   ├── ui/              # ShadCN UI components
│   ├── layout/          # Layout components (Sidebar, Header)
│   └── features/        # Feature-specific components
├── pages/               # Page components
├── services/            # API services
├── store/               # Zustand stores
├── lib/                 # Utilities
├── types/               # TypeScript types
└── App.tsx              # Main app component
```

## Features
✅ Authentication (Login/Logout)
✅ Dashboard with Analytics
✅ Lead Management (CRUD + Convert)
✅ Customer Management (CRUD)
✅ Order Management (Create + Confirm)
✅ Subscription Tracking
✅ Notifications
✅ Responsive Design
✅ Dark Mode Support

## Build for Production
```bash
npm run build
```

## Troubleshooting

### API Connection Issues
- Ensure backend is running on port 5000
- Check CORS configuration in backend
- Verify API_URL in .env file

### Module Not Found Errors
```bash
npm install
npm run dev
```

### Port 3000 Already in Use
Change port in vite.config.ts or:
```bash
lsof -i :3000
kill -9 <PID>
```
