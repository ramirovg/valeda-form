# Valeda Form Project Context

## Project Overview
This is an Angular 20 application for managing Valeda photobiomodulation treatments at Oftalmolaser de Monterrey. The application allows staff to:
- Create and manage patient treatment records
- Track treatment sessions
- Search and filter existing treatments
- Print treatment schedules

The application follows a modern Angular architecture using:
- Standalone components
- Signals for state management
- Reactive forms
- TypeScript
- Tailwind CSS for styling
- Angular SSR (Server-Side Rendering) for production

The backend is a Node.js/Express API with MongoDB storage, deployed with PM2.

## Key Technologies
- **Frontend**: Angular 20, TypeScript, RxJS, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Deployment**: PM2 for process management
- **Build Tools**: Angular CLI, Webpack
- **Development Tools**: Concurrently for running frontend and backend together

## Project Structure
- `src/` - Angular frontend application
  - `app/` - Main application components and services
    - `components/` - Reusable UI components
    - `models/` - TypeScript interfaces and models
    - `services/` - Angular services for data management
- `backend-api/` - Node.js/Express backend API
  - `server/` - Server-side code
    - `controllers/` - Request handlers
    - `models/` - Mongoose data models
    - `routes/` - API route definitions
    - `services/` - Business logic
- `public/` - Static assets

## Building and Running

### Development
1. Install dependencies: `npm install` (in both root and backend-api directories)
2. Start development server: `npm start` (runs both frontend and backend)
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3001/api

### Production
1. Build frontend: `npm run build:production`
2. Start backend: `cd backend-api && npm start`
   - Serves both API and frontend static files
   - Production URL: http://localhost:3001 (or subfolder /valeda)

## Development Conventions
- Use Angular standalone components
- Manage state with Signals where possible
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Backend follows REST API conventions
- Services handle all data operations
- Components should be focused and reusable

## Key Features
- Patient treatment record management
- Session tracking with technician/time
- Search and filtering capabilities
- Printable treatment schedules
- Responsive design for different devices
- Fallback to localStorage when server is unavailable