# Project: Valeda Treatment Management System

## Project Overview

This is a full-stack web application for managing Valeda photobiomodulation treatments at the Oftalmolaser de Monterrey clinic. The system allows staff to create, search, view, and print treatment records for patients.

**Frontend:**

*   **Framework:** Angular 20
*   **UI:** Tailwind CSS, Flowbite
*   **State Management:** Angular Signals
*   **Key Features:**
    *   Patient and treatment search with filters.
    *   A comprehensive form for creating and updating treatment details.
    *   Session tracking for the 9-session treatment course.
    *   Printing of a formatted treatment summary sheet.
    *   Client-side fallback to `localStorage` if the backend is unavailable.

**Backend:**

*   **Framework:** Node.js with Express
*   **Database:** MongoDB with Mongoose ODM
*   **Architecture:**
    *   RESTful API for managing `treatments` and `doctors`.
    *   Server-Side Rendering (SSR) with Angular Universal.
    *   Modular routing and configuration.
    *   Middleware for request logging and error handling.

## Building and Running

### Prerequisites

*   Node.js and npm
*   MongoDB instance (or configure to use a cloud-based one)

### Key Commands

*   **Full Development Mode (Frontend + Backend):**
    ```bash
    npm run dev:full
    ```
    This command concurrently starts the Angular development server (usually on `http://localhost:4200`) and the Node.js API server (on `http://localhost:3001`).

*   **Run Frontend Only:**
    ```bash
    npm run start
    ```

*   **Run Backend API Only:**
    ```bash
    npm run dev:api
    ```

*   **Build for Production:**
    ```bash
    npm run build
    ```
    This command builds both the browser and server applications and places the output in the `dist/valeda-form` directory.

*   **Run Production Server:**
    ```bash
    npm run serve:ssr:valeda-form
    ```
    This starts the production Node.js server to serve the SSR application.

*   **Run Unit Tests:**
    ```bash
    npm run test
    ```

## Development Conventions

*   **State Management:** The frontend heavily utilizes **Angular Signals** for reactive state management in services (`ValedaService`). This is the preferred way to manage and share application state.
*   **API Interaction:** All backend communication is centralized in `ValedaService`. It handles HTTP requests, error handling, and the `localStorage` fallback mechanism.
*   **Styling:** The project uses **Tailwind CSS**. Utility classes are preferred for styling components.
*   **Server Logic:** The backend follows a standard MVC-like pattern with routes, controllers, services, and models clearly separated in the `src/server` directory.
*   **Database Models:** Mongoose schemas define the structure for `Treatment` and `Doctor` collections.
*   **Printing:** The `AppComponent` contains logic to generate a specific HTML structure for printing treatment records. This is a key feature of the application.
