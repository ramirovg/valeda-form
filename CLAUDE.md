# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 20 application called "valeda-form" with Server-Side Rendering (SSR) support. It's a standalone Angular application using the modern Angular architecture with standalone components and signal-based change detection. The project includes TailwindCSS v3 and Flowbite for UI components.

## Development Commands

### Essential Commands
- `npm start` or `ng serve` - Start Angular development server at http://localhost:4200/
- `ng build` - Build the project for production (outputs to `dist/`)
- `ng build --watch --configuration development` - Build in watch mode for development
- `ng test` - Run unit tests via Karma
- `npm run serve:ssr:valeda-form` - Serve the SSR version using Express server

### MongoDB Development Commands
- `npm run build:server` - Compile server TypeScript modules to JavaScript
- `npm run dev:api` - Start development API server on http://localhost:3001
- `npm run dev:full` - Start both Angular and API servers concurrently

### MongoDB Setup
The application uses MongoDB with Mongoose ODM for data persistence. The modular server architecture includes:

#### Database Configuration
- **Default URI**: `mongodb://localhost:27017/valeda-treatments`
- **Environment Variable**: Set `MONGODB_URI` to override default connection
- **Auto-connection**: API server automatically connects to MongoDB on startup
- **Graceful shutdown**: Database connection is properly closed on server shutdown

#### Development Workflow
1. **Start MongoDB**: Ensure MongoDB is running locally on port 27017
2. **Build Server**: Run `npm run build:server` to compile TypeScript modules
3. **Start API Server**: Run `npm run dev:api` to start the API on port 3001
4. **Start Angular**: Run `npm start` to start Angular on port 4200
5. **Full Development**: Run `npm run dev:full` to start both servers simultaneously

#### API Endpoints
- `GET /api/treatments` - List treatments with pagination
- `POST /api/treatments` - Create new treatment
- `GET /api/treatments/:id` - Get specific treatment
- `PUT /api/treatments/:id` - Update treatment
- `DELETE /api/treatments/:id` - Delete treatment
- `GET /api/doctors/sample` - Get sample doctors
- `GET /health` - API health check

#### Data Models
- **Treatment**: Patient info, doctor, sessions, treatment type
- **Doctor**: Name, specialization, creation date
- **Patient**: Name, age, birth date, gender, contact info
- **Session**: Session number, date, eye treated, parameters

### Code Generation
- `ng generate component component-name` - Generate new component
- `ng generate directive|pipe|service|class|guard|interface|enum|module` - Generate other Angular artifacts

## Architecture

### Application Structure
- **Standalone Components**: Uses Angular 20's standalone component architecture
- **SSR Enabled**: Full server-side rendering with hydration support
- **Express Server**: Custom Express server (`server.ts`) for SSR serving
- **MongoDB Integration**: Modular server architecture with Mongoose ODM
- **Routing**: Angular Router with empty routes configuration (ready for expansion)
- **UI Framework**: TailwindCSS v3.4.17 for utility-first CSS
- **Component Library**: Flowbite v3.1.2 for pre-built UI components

### MongoDB Architecture
The server is organized into modular components for maintainability:

- **Models** (`src/server/models/`): Mongoose schemas and data models
- **Controllers** (`src/server/controllers/`): Request handlers and business logic
- **Services** (`src/server/services/`): Database operations and business services
- **Routes** (`src/server/routes/`): API route definitions
- **Middleware** (`src/server/middleware/`): Validation, logging, and error handling
- **Config** (`src/server/config/`): Database configuration and connection management

### Key Configuration Files
- `angular.json`: Angular CLI workspace configuration with SSR setup
- `server.ts`: Express server for SSR rendering
- `src/main.server.ts`: Server-side bootstrapping
- `tsconfig.app.json`, `tsconfig.spec.json`: TypeScript configurations
- `tailwind.config.js`: TailwindCSS configuration with Flowbite plugin
- `postcss.config.js`: PostCSS configuration for TailwindCSS processing

### Component Architecture
- Uses standalone components (no NgModules)
- Application configured in `src/app/app.config.ts`
- Main app component at `src/app/app.component.ts`
- Router outlet ready for route components

### Build Configuration
- Production build includes optimizations and output hashing
- Development build with source maps and no optimization
- Bundle budgets: 500kB warning, 1MB error for initial bundle
- Component styles: 2kB warning, 4kB error

## Testing

- **Unit Tests**: Karma + Jasmine setup
- **Test Configuration**: Uses `tsconfig.spec.json`
- **Coverage**: Karma coverage reporting enabled

## UI Development

### TailwindCSS
- Uses TailwindCSS v3.4.17 for utility-first CSS
- Configuration includes Flowbite plugin for extended components
- PostCSS processes TailwindCSS during build
- All TailwindCSS directives are imported in `src/styles.css`

### Flowbite Components
- Flowbite v3.1.2 provides pre-built UI components
- JavaScript imported in `src/main.ts` for interactive components
- Components include buttons, alerts, badges, modals, dropdowns, etc.
- Fully compatible with TailwindCSS utility classes

## Development Notes

- Upgraded from Angular 18 to Angular 20 (latest version)
- TailwindCSS and Flowbite are fully integrated and functional
- The routes array is empty, ready for route definitions
- SSR is pre-configured and functional
- Build process includes TailwindCSS compilation and optimization