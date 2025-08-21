# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 18 application called "valeda-form" with Server-Side Rendering (SSR) support. It's a standalone Angular application using the modern Angular architecture with standalone components and signal-based change detection.

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
- **Standalone Components**: Uses Angular 18's standalone component architecture
- **SSR Enabled**: Full server-side rendering with hydration support
- **Express Server**: Custom Express server (`server.ts`) for SSR serving
- **Routing**: Angular Router with empty routes configuration (ready for expansion)

### Key Configuration Files
- `angular.json`: Angular CLI workspace configuration with SSR setup
- `server.ts`: Express server for SSR rendering
- `src/main.server.ts`: Server-side bootstrapping
- `tsconfig.app.json`, `tsconfig.spec.json`: TypeScript configurations

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

## Development Notes

- This is a fresh Angular 18 project with minimal customization
- No custom rules or specific development practices are currently defined
- The routes array is empty, ready for route definitions
- SSR is pre-configured and functional