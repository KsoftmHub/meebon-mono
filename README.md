# E-commerce Order Processing Monorepo

This repository contains a modular and scalable e-commerce order processing system, built using a Monorepo structure, Microservices, and an Event-Driven Architecture (EDA).

## Architecture Overview

*   **Monorepo:** All services, APIs, and shared code are managed in a single Git repository.
*   **Microservices:** Functionality is divided into independent services (Order, Inventory, Notification, API Gateway).
*   **EDA:** Services communicate asynchronously via Kafka events.

## Structure

```
monorepo-template/
├── apps/             # Individual applications and services
│   ├── api-gateway/    # Public facing API
│   ├── inventory-service/ # Manages product stock
│   ├── notification-service/ # Sends user notifications
│   └── order-service/  # Handles order creation and lifecycle
└── packages/         # Shared code and libraries
    └── shared/       # Common interfaces, types, utilities
├── .github/          # GitHub Actions Workflows
│   └── workflows/
│       └── ci.yaml
├── docker-compose.yaml # Local Kafka setup
├── pnpm-workspace.yaml # pnpm workspaces configuration
├── turbo.json        # Turborepo configuration
├── package.json      # Root dependencies and scripts
├── tsconfig.json     # Root TypeScript configuration
└── README.md
```

## Prerequisites

*   Node.js (v18+)
*   pnpm (`npm install -g pnpm`)
*   Git
*   Docker & Docker Compose

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd monorepo-template
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Start the local Kafka cluster:**
    ```bash
    pnpm run docker:kafka:up
    ```

4.  **Run services in development mode:**
    ```bash
    pnpm run dev
    ```
    Or start a specific service:
    ```bash
    pnpm --filter order-service dev
    ```

## Verifying the Setup

After running `pnpm run dev`, you should see output in your terminal from Turborepo indicating that it's running the `dev` script for each of your applications (`api-gateway`, `order-service`, `inventory-service`, `notification-service`).

Since the current `dev` scripts are simple `echo` commands combined with `tsc --watch & node dist/index.js`, you should look for:

1.  **Turborepo Output:** Lines indicating which tasks are running, for example:
    ```
    • Packages: apps/api-gateway, apps/inventory-service, apps/notification-service, apps/order-service
    • Tasks: dev (4)
    ```
2.  **Service Startup Messages:**
    *   The `echo` part of the `dev` script for each service:
        ```
        apps/api-gateway:dev: Starting api-gateway (dev mode)
        apps/order-service:dev: Starting order-service (dev mode)
        apps/inventory-service:dev: Starting inventory-service (dev mode)
        apps/notification-service:dev: Starting notification-service (dev mode)
        ```
    *   The `console.log` messages from each service's `src/index.ts` file after successful compilation by `tsc --watch` and execution by `node dist/index.js`:
        ```
        apps/api-gateway:dev: API Gateway Service Starting...
        apps/order-service:dev: Order Service Starting...
        apps/inventory-service:dev: Inventory Service Starting...
        apps/notification-service:dev: Notification Service Starting...
        ```
3.  **TypeScript Watch Mode:** `tsc --watch` will be running for each service. If you make a change to a `.ts` file within one of the `apps/*/src` directories and save it, you should see `tsc` recompiling that specific service. The `node dist/index.js` part of the script might need to be manually restarted or you might need a tool like `nodemon` for automatic restarts on changes for a more robust development experience (this is not yet configured).

**To confirm basic operation:**

*   Look for the "Starting [Service Name] (dev mode)" messages.
*   Look for the "[Service Name] Service Starting..." messages.
*   If you don't see errors, and these messages appear, the basic `dev` setup is working.

**For Kafka interaction (conceptual at this stage):**
*   The placeholder Kafka logic in `order-service` and `inventory-service` currently only logs simulation messages (e.g., `[Order Service] Simulating publishing OrderCreated event...`). If you were to uncomment the actual KafkaJS code and call the functions, you would then monitor Kafka topics or use Kafka tools to see messages.

## Building & Testing

*   **Build all projects:**
    ```bash
    pnpm run build
    ```
*   **Run all tests:**
    ```bash
    pnpm run test
    ```
*   **Run linting:**
    ```bash
    pnpm run lint
    ```

## Development Workflow

Use `pnpm run dev` to start your local environment. Turborepo handles watching for changes and rebuilding/restarting affected services. Refer to `turbo.json` and individual `package.json` files for script details.

## Task Graph

Visualize the project dependencies and build graph:
```bash
pnpm turbo graph
```

## 5. Core Development Commands

All commands should be run from the root of the `monorepo-template` directory.

*   **Start all services in development mode:**
    Uses Turborepo to start all services concurrently.
    ```bash
    pnpm run dev
    ```

*   **Visualize task graph:**
    Shows the dependencies between tasks and packages.
    ```bash
    pnpm turbo graph
    ```

*   **Access the Monorepo CLI:**
    Builds and provides access to the custom CLI tool.
    ```bash
    pnpm run cli -- <command> [options]
    # Example: pnpm run cli -- --help
    ```

*   **Generate a new application:**
    Uses the custom CLI tool to scaffold a new application in the `apps/` directory.
    Replace `<app-name>` with the desired name for your new application.
    ```bash
    pnpm run cli -- generate app <app-name>
    # Example: pnpm run cli -- generate app payment-service
    ```
    After running, follow the instructions to run `pnpm install`.

*   **Generate a new package:**
    Uses the custom CLI tool to scaffold a new package in the `packages/` directory.
    Replace `<package-name>` with the desired name for your new package.
    ```bash
    pnpm run cli -- generate package <package-name>
    # Example: pnpm run cli -- generate package utils-lib
    ```
    After running, follow the instructions to run `pnpm install`.

## 6. Managing Dependencies

---
*(Add more detailed documentation for each service, event schemas, API endpoints as the project grows)*
