# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kafoto Frontend is a React + TypeScript application built with Vite (using Rolldown variant for improved performance). The app uses React Router for navigation, Tailwind CSS for styling, and implements JWT-based authentication with a backend API.

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Type-check and build for production
npm run build

# Run ESLint on all TypeScript files
npm run lint

# Preview production build locally
npm run preview
```

## Architecture

### Build System
- **Bundler**: Uses `rolldown-vite@7.2.5` (Vite variant with Rolldown for faster builds)
- **Compiler**: Vite plugin with Babel for Fast Refresh (can use oxc when in rolldown-vite)
- **TypeScript**: Strict mode enabled with bundler module resolution

### Routing Structure
- React Router v7 with `BrowserRouter`
- Routes defined in `src/App.tsx`
- Protected routes use `<ProtectedRoute />` wrapper component that checks for `accessToken` in localStorage
- Public route: `/login`
- Protected routes: `/` (HomePage)

### Authentication Flow
- Token-based auth managed in `src/services/auth.ts`
- Uses access/refresh token pattern with automatic refresh on 401 responses
- Tokens stored in localStorage (`accessToken`, `refreshToken`)
- `authService.fetchWithAuth()` handles authenticated requests with automatic token refresh
- Backend API base URL: `http://127.0.0.1:8000/api/v1`

### Component Organization
```
src/
├── components/
│   ├── auth/          # Authentication components (ProtectedRoute, SocialButtons)
│   ├── common/        # Reusable UI components (Button, Input)
│   ├── dashboard/     # Dashboard-specific components (FilterBar, ProjectCard, Stats, DashboardHeader)
│   └── layout/        # Layout components (Header, Footer)
├── pages/             # Route-level page components
├── services/          # API services and business logic
└── assets/            # Static assets
```

### TypeScript Configuration
- Uses TypeScript 5.9.3 with strict type checking
- Three separate tsconfigs: root (references only), app, and node
- Strict mode with `noUnusedLocals` and `noUnusedParameters` enabled
- `erasableSyntaxOnly` enabled for type-only imports
- Target: ES2022 with bundler module resolution

### Styling
- Tailwind CSS v3 configured to scan `./index.html` and `./src/**/*.{ts,tsx}`
- PostCSS with autoprefixer
- Custom styles in component CSS files and `index.css`

## Important Implementation Details

### Authentication Pattern
When making API calls to protected endpoints, always use `authService.fetchWithAuth()` instead of raw fetch. This ensures:
1. Authorization header is automatically added
2. 401 responses trigger automatic token refresh
3. Failed refresh redirects to login page

Example:
```typescript
const response = await authService.fetchWithAuth(`${API_URL}/endpoint`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
```

### Protected Routes
To add new protected routes, wrap them in the `<ProtectedRoute />` element in `src/App.tsx`:
```typescript
<Route element={<ProtectedRoute />}>
  <Route path="/new-page" element={<NewPage />} />
</Route>
```

### ESLint Configuration
Current setup uses flat config format with:
- TypeScript ESLint recommended rules
- React Hooks plugin for hooks linting
- React Refresh plugin for Vite HMR
- Files pattern: `**/*.{ts,tsx}`
- Ignores: `dist/`

To enable stricter type-aware linting (recommended for production), see README.md for configuration with `recommendedTypeChecked` or `strictTypeChecked`.
