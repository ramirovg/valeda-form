# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 20 application called "valeda-form" with Server-Side Rendering (SSR) support. It's a standalone Angular application using the modern Angular architecture with standalone components and signal-based change detection. The project includes TailwindCSS v3 and Flowbite for UI components.

## Development Commands

### Essential Commands
- `npm start` or `ng serve` - Start development server at http://localhost:4200/
- `ng build` - Build the project for production (outputs to `dist/`)
- `ng build --watch --configuration development` - Build in watch mode for development
- `ng test` - Run unit tests via Karma
- `npm run serve:ssr:valeda-form` - Serve the SSR version using Express server

### Code Generation
- `ng generate component component-name` - Generate new component
- `ng generate directive|pipe|service|class|guard|interface|enum|module` - Generate other Angular artifacts

## Architecture

### Application Structure
- **Standalone Components**: Uses Angular 20's standalone component architecture
- **SSR Enabled**: Full server-side rendering with hydration support
- **Express Server**: Custom Express server (`server.ts`) for SSR serving
- **Routing**: Angular Router with empty routes configuration (ready for expansion)
- **UI Framework**: TailwindCSS v3.4.17 for utility-first CSS
- **Component Library**: Flowbite v3.1.2 for pre-built UI components

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