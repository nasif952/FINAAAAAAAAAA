# DiamondAI - Comprehensive Project Documentation

**Version**: 1.1 (Updated YYYY-MM-DD) - Reflects refactoring of Valuation Analysis data source.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Target Audience](#target-audience)
3. [Key Value Proposition](#key-value-proposition)
4. [Technical Stack](#technical-stack)
5. [Project Structure](#project-structure)
6. [Setup & Installation](#setup--installation)
7. [Environment Variables](#environment-variables)
8. [Core Features & Implementation](#core-features--implementation)
    *   [Valuation System](#valuation-system)
    *   [Benchmarking System](#benchmarking-system)
    *   [Cap Table Management](#cap-table-management)
    *   [Financial Overview & Performance Tracking](#financial-overview--performance-tracking)
    *   [Data Room System (Storage API Based)](#data-room-system-storage-api-based)
    *   [Authentication](#authentication)
    *   [Pitch Deck Analysis](#pitch-deck-analysis)
    *   [Settings](#settings)
9. [Database Architecture](#database-architecture)
    *   [Supabase Tables Detailed](#supabase-tables-detailed)
    *   [Table Relationships](#table-relationships)
    *   [Row-Level Security (RLS)](#row-level-security-rls)
    *   [Supabase Storage](#supabase-storage)
10. [State Management](#state-management)
    *   [TanStack Query (React Query)](#tanstack-query-react-query)
    *   [React Context API](#react-context-api)
    *   [Local Component State (useState)](#local-component-state-usestate)
11. [Components Architecture](#components-architecture)
    *   [Component Types](#component-types)
    *   [Key Components Deep Dive](#key-components-deep-dive)
12. [Routing](#routing)
13. [Integration Points](#integration-points)
    *   [Supabase Integration](#supabase-integration)
14. [Development Practices](#development-practices)
    *   [Coding Style & Linting](#coding-style--linting)
    *   [Error Handling](#error-handling)
    *   [Form Validation](#form-validation)
    *   [API/Data Layer Interaction](#apidata-layer-interaction)
15. [Deployment](#deployment)
16. [Potential Future Enhancements](#potential-future-enhancements)
17. [Glossary](#glossary)

---

## 1. Project Overview

DiamondAI (DAISolution) is a sophisticated, web-based platform designed to empower startup founders and teams. It provides a centralized suite of tools for managing critical aspects of a startup's lifecycle, including financial tracking, performance benchmarking, valuation analysis, cap table management, and secure document sharing for investor relations and due diligence.

The platform distinguishes itself through a robust, multi-methodology valuation engine, offering users a more holistic and data-driven understanding of their company's worth compared to single-method approaches.

## 2. Target Audience

-   Early-stage startup founders (Pre-seed, Seed, Series A)
-   Startup executive teams (CEO, CFO, COO)
-   Venture Capitalists and Angel Investors (potentially through dedicated views or reports)
-   Startup advisors and consultants

## 3. Key Value Proposition

-   **Comprehensive Valuation:** Provides a reliable valuation range using five distinct, industry-recognized methodologies, weighted by company stage.
-   **Data-Driven Insights:** Enables tracking of key financial and operational metrics over time.
-   **Benchmarking:** Allows startups to compare their performance against relevant industry benchmarks.
-   **Centralized Management:** Offers tools for cap table management, investor relations, and secure document sharing in one platform.
-   **Streamlined Due Diligence:** Facilitates the due diligence process through an organized Data Room feature.

## 4. Technical Stack

The project leverages a modern, type-safe technology stack chosen for developer productivity, performance, and scalability.

### Frontend
-   **React 18.3.1**: Core JavaScript library for building the user interface declaratively.
-   **TypeScript**: Enhances JavaScript with static typing for improved code quality, maintainability, and developer experience, catching errors during development.
-   **Vite 5.4.1**: Next-generation frontend tooling providing extremely fast Hot Module Replacement (HMR) for development and optimized builds for production.
-   **TailwindCSS 3.4.11**: A utility-first CSS framework enabling rapid UI development by composing utility classes directly in the markup. Configured via `tailwind.config.js`.
-   **shadcn/ui**: A collection of beautifully designed, accessible, and customizable UI components built on top of Radix UI primitives and styled with TailwindCSS. Components are added via CLI and become part of the local codebase. Found in `src/components/ui/`.
-   **Lucide Icons**: A large, consistent, and tree-shakable SVG icon library. Used throughout the UI for visual cues.
-   **React Router 6.26.2**: Standard library for handling client-side routing within the React application. Manages URL changes and renders corresponding page components.

### State Management & Data Fetching
-   **TanStack Query (React Query) 5.56.2**: Powerful asynchronous state management library. Used extensively for fetching, caching, synchronizing, and updating server state (data from Supabase). Manages loading states, error handling, retries, and background updates. See [State Management](#state-management) section for patterns.
-   **React Context API**: Used sparingly for truly global state that doesn't change often, such as authentication status (`AuthContext`) and potentially theme settings.
-   **Zod 3.23.8**: TypeScript-first schema declaration and validation library. Used with React Hook Form to validate form inputs and potentially API responses/requests. Schemas are defined in `src/schemas/`.
-   **React Hook Form 7.53.0**: Performant, flexible, and extensible library for managing form state and validation. Integrates seamlessly with Zod via `@hookform/resolvers`.

### Data Visualization
-   **Recharts 2.15.1**: A composable charting library built on React components. Used for rendering bar charts, line charts, etc., in the Financial Overview and Valuation Analysis sections.

### Backend & Database
-   **Supabase 2.49.3**: Open-source Firebase alternative providing a suite of backend tools built around a PostgreSQL database.
    -   **PostgreSQL Database**: Robust, relational database storing all application data (companies, valuations, users, metrics, etc.).
    -   **Authentication**: Handles user sign-up, login, session management, and password recovery using Supabase Auth.
    -   **Row-Level Security (RLS)**: Database-level security policies ensuring users can only access data they are permitted to see.
    -   **Storage**: Provides S3-compatible object storage. Used directly by the [Data Room System](#data-room-system-storage-api-based) for file uploads, downloads, and organization without relying on intermediate database tables for listing.
    -   **Realtime (Optional)**: Supabase offers real-time capabilities via PostgreSQL subscriptions, which could be leveraged for features like live notifications (currently not heavily used).
    -   **Edge Functions (Optional)**: Serverless functions for custom backend logic (currently not heavily used).

## 5. Project Structure

The project follows a hybrid approach, primarily feature-based within `pages` and `components`, with shared logic and utilities separated.

```
src/
├── App.css                 # Minimal global styles, prefer Tailwind utilities.
├── App.tsx                 # Root application component: Sets up routing and context providers.
│
├── components/             # Reusable UI components, organized by feature or type.
│   ├── AuthGuard.tsx       # Wrapper component to protect routes requiring authentication.
│   ├── Button.tsx          # Potentially customized Button extending shadcn/ui Button.
│   ├── Card.tsx            # Standardized card layout component.
│   ├── DataTable.tsx       # Reusable table component for displaying data (e.g., Cap Table).
│   ├── Layout.tsx          # Main application layout (Sidebar, Topbar, Content area).
│   ├── ProgressBar.tsx     # Generic progress bar component.
│   ├── SidebarNav.tsx      # Renders the main navigation links in the sidebar.
│   ├── StepProgress.tsx    # Component for visualizing steps in a process (e.g., questionnaire).
│   ├── TopBar.tsx          # Application header/top navigation bar.
│   │
│   ├── dialogs/            # Modal dialog components.
│   │   ├── AddDocumentDialog.tsx     # Dialog for uploading files in the Data Room.
│   │   ├── CreateFolderDialog.tsx    # Dialog for creating folders in the Data Room.
│   │   └── EditDocumentMetadataDialog.tsx  # (Potentially unused/generic).
│   │
│   ├── investor/           # Components specific to investor features.
│   ├── performance/        # Components related to performance metric tracking tabs.
│   │   ├── CustomMetricsTab.tsx    # Tab content for viewing/defining metrics.
│   │   ├── DefaultMetricsTab.tsx   # Tab content for updating metric values.
│   │   └── PerformanceTab.tsx      # Tab content for viewing historical performance.
│   │
│   ├── pitch-deck/         # Components for the Pitch Deck Analysis feature.
│   ├── settings/           # Components used within the Settings page.
│   ├── valuation/          # Components specific to the Valuation Analysis feature.
│   │   ├── BenchmarkComparisonCard.tsx # Card comparing user data to benchmarks.
│   │   └── EditableBenchmarks.tsx  # Component for users to potentially edit benchmarks.
│   │
│   └── ui/                 # Raw shadcn/ui components added via CLI (Button, Input, etc.).
│
├── contexts/               # React Context providers for global state.
│   └── AuthContext.tsx     # Manages authentication state, user data, login/logout functions.
│
├── hooks/                  # Custom React Hooks encapsulating reusable logic.
│   ├── useCompanyForm.ts   # Hook for managing the company details form state and submission.
│   ├── useFileUpload.ts    # Potentially a generic file upload hook (Data Room uses direct Supabase calls).
│   ├── useQuestionnaireData.ts # Manages state and interaction logic for the valuation questionnaire.
│   ├── useSettingsData.ts  # Hook for managing user/application settings.
│   ├── useStartupScore.ts  # Core hook for the Benchmarking feature; fetches data, calculates scores.
│   ├── useValuation.ts     # Core hook for the Valuation Analysis feature; fetches data, triggers calculations, manages state.
│   ├── use-mobile.tsx      # Helper hook to detect if the application is viewed on a mobile device.
│   └── use-toast.ts        # Facade for displaying toast notifications using shadcn/ui Toast.
│
├── integrations/           # Configuration and clients for external services.
│   └── supabase/           # Supabase specific integration files.
│       ├── client-extension.ts # Potentially extends the Supabase client (if needed).
│       ├── client.ts       # Initializes and exports the Supabase JavaScript client instance.
│       └── types.ts        # Auto-generated TypeScript definitions for the Supabase database schema (`supabase gen types typescript ...`). Crucial for type safety.
│
├── lib/                    # Core application logic, utilities, and algorithms.
│   ├── calculateScore.ts   # Implements the startup scoring algorithm for Benchmarking.
│   ├── formatters.ts       # Utility functions for formatting data (currency, percentages, dates).
│   ├── utils.ts            # General utility functions not specific to a feature.
│   └── valuationCalculator.ts # Contains the algorithms for the five valuation methodologies.
│
├── pages/                  # Top-level route components, defining application pages.
│   ├── Auth.tsx            # Login/Signup page component.
│   ├── CapTable.tsx        # Page for managing the capitalization table.
│   ├── Dashboard.tsx       # Main application dashboard after login.
│   ├── Data.tsx            # Data Room page for secure document management.
│   ├── DueDiligence.tsx    # Page related to due diligence processes.
│   ├── FinancialOverview.tsx # Central page for viewing financial metrics, performance history, and updating metrics via tabs.
│   ├── Index.tsx           # Landing page or initial route.
│   ├── InvestorDashboard.tsx # Dashboard view potentially tailored for investors.
│   ├── NotFound.tsx        # 404 Page Not Found component.
│   ├── Performance.tsx     # DEPRECATED - Functionality merged into FinancialOverview.tsx.
│   ├── PitchDeckAnalysis.tsx # Page for pitch deck analysis features.
│   ├── Settings.tsx        # Page for user and company settings.
│   ├── Valuation.tsx       # Wrapper page potentially containing valuation sub-routes/tabs.
│   │
│   └── valuation/          # Sub-components specifically used within the Valuation section/pages.
│       ├── BenchmarksContent.tsx # Renders the Benchmarking UI (scores, comparisons).
│       ├── HistoryContent.tsx    # Displays historical valuation data.
│       ├── QuestionnaireContent.tsx # Renders the multi-step valuation questionnaire form.
│       └── ValuationContent.tsx  # Renders the main valuation analysis results (slider, charts).
│
├── schemas/                # Zod validation schemas.
│   └── companySchema.ts    # Zod schema for validating company form data.
│
├── utils/                  # Generic utility functions (Consider merging into `lib/utils.ts`).
│
├── index.css               # Entry point for CSS; includes TailwindCSS base, components, and utilities directives.
├── main.tsx                # Main application entry point; renders the root App component into the DOM.
└── vite-env.d.ts           # TypeScript definitions for Vite environment variables.
```

## 6. Setup & Installation

Follow these steps to set up the project locally:

1.  **Prerequisites:**
    *   Node.js (Version >= 18.x recommended)
    *   npm or yarn package manager
    *   Access to the Supabase project (URL and Anon Key)

2.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

4.  **Environment Variables:**
    *   Create a `.env` file in the root directory of the project.
    *   Copy the contents of `.env.example` (if it exists) or add the required variables (see [Environment Variables](#environment-variables) section below).
    *   Populate the `.env` file with your specific Supabase project URL and Anon Key. **Never commit your `.env` file to version control.**

5.  **Generate Supabase Types (Optional but Recommended):**
    *   Ensure you have the Supabase CLI installed (`npm install supabase --save-dev`).
    *   Log in to the Supabase CLI (`npx supabase login`).
    *   Link your project (`npx supabase link --project-ref <your-project-id>`).
    *   Generate the types:
        ```bash
        npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
        ```
    *   This step ensures type safety when interacting with the database via the Supabase client.

6.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running, typically at `http://localhost:5173` (Vite's default).

## 7. Environment Variables

The application requires the following environment variables to be set, typically in a `.env` file in the project root for local development. These **must** be configured in the Vercel project settings for deployment.

-   **`VITE_SUPABASE_URL`**: The unique URL for your Supabase project. Found in your Supabase project settings (API -> Project URL).
-   **`VITE_SUPABASE_ANON_KEY`**: The public "anon" key for your Supabase project. Found in your Supabase project settings (API -> Project API Keys -> `anon` `public`). This key is safe to expose in the frontend code as Row Level Security protects your data.

**`.env` File Example:**

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key...........
```

*Note: Vite exposes environment variables prefixed with `VITE_` to the client-side code. Do not store sensitive secrets (like Supabase service keys) using this prefix.*

## 8. Core Features & Implementation

### Valuation System

**Goal:** To provide a comprehensive and justifiable startup valuation using multiple methodologies.

**Key Components:**
-   `src/pages/valuation/ValuationContent.tsx`: Main UI for displaying results (slider, 5-method chart, weights, financial inputs).
-   `src/pages/valuation/QuestionnaireContent.tsx`: UI for the multi-step questionnaire (input for Benchmarking system).
-   `src/hooks/useValuation.ts`: Hook managing data fetching (valuation, company), state (loading, error, calculation status, *calculated method results*), and orchestrating calculations/updates.
-   `src/hooks/useQuestionnaireData.ts`: Hook managing state and interactions specifically for the questionnaire form.
-   `src/lib/valuationCalculator.ts`: Contains the core calculation logic for the 5 valuation methods and the combined weighting/normalization.

**Data Flow (Valuation Analysis Tab):**
1.  `ValuationContent.tsx` mounts and uses `useValuation`.
2.  `useValuation` fetches the latest `valuations` record and associated `companies` data from Supabase using TanStack Query (`queryKey: ['valuation']`).
3.  The UI displays the fetched data (e.g., `selected_valuation` on the slider, company details). The 5-method chart initially shows mock data or results from the last calculation stored in `useValuation`'s local state.
4.  User clicks "Recalculate".
5.  `ValuationContent.tsx` calls `recalculateValuation()` from `useValuation`.
6.  `useValuation` triggers the `recalculateValuationMutation`.
7.  The mutation **no longer uses questionnaire data**. It takes the existing `valuationData` and `companyData` (fetched in step 2) and passes them to `calculateValuation` in `valuationCalculator.ts`.
8.  `valuationCalculator.ts`:
    *   `calculateValuation` receives the DB data.
    *   It calls the 5 internal calculation methods (`calculateScorecardMethod`, `calculateChecklistMethod`, etc.), **each now rewritten** to use fields from the input `valuationData` and `companyData` (e.g., `last_revenue`, `annual_roi`, `stage`, `total_employees`, `last_year_ebitda`, `industry_multiple`) instead of parsing questionnaire responses.
    *   It calculates the `combinedValuation` based on stage-specific weights (`getDefaultWeights`) applied to the results of the 5 methods (after normalization).
    *   It returns the `ValuationResults` object containing the individual method values and weights.
9.  `useValuation`'s Mutation:
    *   Receives the `ValuationResults` back from `calculateValuation`.
    *   Updates its *local state* (`valuationMethods`) with the detailed results using `setValuationMethods`. This makes the 5-method chart update.
    *   Calls `updateValuationWithResults` to save the *updated `selected_valuation`* (and related pre/post-money values) back to the `valuations` table in Supabase. **Note:** It does *not* save the individual method breakdown to the DB.
    *   On success, invalidates the `['valuation']` query cache, causing a refetch of the main valuation data (step 2) to ensure consistency.

**Key Distinction:** The "Valuation Analysis" tab's calculations are driven by data fields editable elsewhere (likely Settings or Update Metrics), **not** the valuation questionnaire.

### Benchmarking System

**Goal:** To allow startups to compare their performance against industry standards and understand their relative strengths/weaknesses.

**Key Components:**
-   `src/pages/valuation/BenchmarksContent.tsx`: Main UI displaying the overall startup score, category scores, metric breakdowns, and comparisons to benchmarks.
-   `src/hooks/useStartupScore.ts`: Core hook fetching necessary data (company, valuation, performance metrics, *questionnaire data*), triggering score calculations, and managing state.
-   `src/lib/calculateScore.ts`: Contains the algorithm for calculating the overall score and category scores based on comparing startup data against benchmarks.
-   `src/components/valuation/BenchmarkComparisonCard.tsx`: Component displaying industry benchmarks.
-   `src/components/valuation/EditableBenchmarks.tsx`: Allows users to potentially override default benchmarks (uses `user_benchmarks` table).

**Data Flow & Sources:**
1.  `BenchmarksContent.tsx` mounts and uses `useStartupScore`.
2.  `useStartupScore` fetches data using TanStack Query:
    *   Company data (`queryKey: ['company-data']`) from `companies` table.
    *   Valuation data (`queryKey: ['valuation-data']`) from `valuations` table.
    *   Performance metrics (`queryKey: ['performance-metrics-latest']`) from `performance_values` table.
    *   **Crucially: Questionnaire responses (`queryKey: ['questionnaire_questions']`) from `questionnaire_questions` table.** This is fetched directly when `calculateScore` is called.
3.  `BenchmarksContent.tsx` (or `useStartupScore` automatically) triggers `calculateScore()` from the hook.
4.  `useStartupScore` ensures all required data pieces are loaded before calling the *actual* calculation function `calculateStartupScore` in `calculateScore.ts`.
5.  `calculateScore.ts`:
    *   `calculateStartupScore` receives `companyData`, `performanceData`, `valuationData`, and direct `questionnaireData`.
    *   **Data Priority for Scoring:** It explicitly prioritizes data from the **questionnaire** for metrics like revenue, growth rate, team size, etc. If questionnaire data is missing for a specific metric, it falls back to system defaults or potentially other sources (though the docs state fallback to Performance metrics is removed).
    *   It compares the prioritized startup data against benchmark values (either defaults or from the `user_benchmarks` table).
    *   It calculates individual metric scores, category scores (Finance, Team, Growth, Market, Product), and the overall `totalScore`.
    *   Returns the detailed `ScoreData` object.
6.  `useStartupScore` updates its state with the calculated score.
7.  `BenchmarksContent.tsx` receives the score data from the hook and renders the visualizations.

**Key Distinction:** The Benchmarking system relies heavily on the **Valuation Questionnaire** as the primary source of truth for the metrics being benchmarked.

### Cap Table Management

**Goal:** To provide founders with tools to track ownership, investments, and equity dilution.

**Key Components:**
-   `src/pages/CapTable.tsx`: The main page component rendering the cap table UI, including shareholder lists, funding round details, and potentially visualizations.
-   `src/components/DataTable.tsx`: Likely used to display the shareholder and transaction data in a structured table.

**Functionality:**
-   Adding/Editing Shareholders (`shareholders` table).
-   Recording Funding Rounds (`investments` table, potentially linked to `shareholders`).
-   Calculating share prices and ownership percentages.
-   Managing Employee Stock Ownership Plans (ESOPs) - details TBC based on implementation.
-   Visualizing equity distribution and dilution scenarios.

**Data Interaction:** Primarily interacts with the `shareholders` and `investments` tables in Supabase.

### Financial Overview & Performance Tracking

**Goal:** To provide a centralized dashboard for viewing key financial metrics, tracking performance against targets over time, and managing metric definitions.

**Key Components:**
-   `src/pages/FinancialOverview.tsx`: Main page container using `Tabs` to organize different sections. Fetches overview data.
-   `src/components/performance/DefaultMetricsTab.tsx`: Tab content for inputting/updating actual vs. target values for predefined metrics (`performance_values` table).
-   `src/components/performance/PerformanceTab.tsx`: Tab content for visualizing historical metric trends (likely using data from `performance_values`).
-   `src/components/performance/CustomMetricsTab.tsx`: Tab content for viewing metric definitions (`performance_metrics` table) and potentially adding custom metrics.
-   `FinancialMetricCard` (defined within `FinancialOverview.tsx`): Reusable card component to display individual metrics on the Overview tab.
-   `Recharts`: Used for Bar and Line charts on the Overview tab.

**Data Flow:**
1.  `FinancialOverview.tsx` fetches baseline data for the Overview tab (e.g., latest `performance_values` for key metrics).
2.  When switching tabs:
    *   **Update Metrics:** `DefaultMetricsTab` likely fetches metrics definitions (`performance_metrics`) and existing values (`performance_values`) for the selected period. It uses mutations (`useMutation`) to save updated values back to the `performance_values` table.
    *   **Performance History:** `PerformanceTab` fetches historical data from `performance_values` to render charts/tables.
    *   **Metric Definitions:** `CustomMetricsTab` fetches data from `performance_metrics`.

**Data Interaction:** Primarily interacts with `performance_metrics` and `performance_values` tables.

### Data Room System (Storage API Based)

**Goal:** Provide a secure and organized way for startups to manage and share documents, typically for due diligence or investor relations.

**Key Distinction:** This feature interacts **directly** with Supabase Storage (`data_room` bucket) for listing, uploading, downloading, and deleting files/folders. It **does not** primarily rely on the `files` or `folders` database tables for browsing structure, although those tables might be used for supplementary metadata if needed elsewhere.

**Key Components:**
-   `src/pages/Data.tsx`: Main UI for browsing folders and files within the `data_room` bucket.
-   `src/components/dialogs/AddDocumentDialog.tsx`: Handles file uploads directly to the current path in storage.
-   `src/components/dialogs/CreateFolderDialog.tsx`: Creates folders by uploading a `.placeholder` file to the desired storage prefix.

**Implementation:**
-   **Listing:** Uses `supabase.storage.from('data_room').list(currentPath)` to get items. Items without extensions or ending in `/` are typically treated as folders (prefixes).
-   **Navigation:** `useState` (`currentPath`, `folderPath`) manages the current viewing location within the storage bucket.
-   **Uploads:** `supabase.storage.from('data_room').upload(filePath, file)`.
-   **Downloads:** `supabase.storage.from('data_room').download(filePath)`.
-   **Deletes:** `supabase.storage.from('data_room').remove([paths])`. Handles deleting files or entire folder prefixes.
-   **State Management:** TanStack Query (`['storage', 'data_room', currentPath]`) manages the state for `list()` calls, providing caching and background updates.

### Authentication

**Goal:** Securely manage user access to the application.

**Key Components:**
-   `src/pages/Auth.tsx`: UI for login and signup forms.
-   `src/contexts/AuthContext.tsx`: Context provider managing user session, profile data, login/logout functions, and loading state. Wraps the entire application in `App.tsx`.
-   `src/components/AuthGuard.tsx`: A wrapper component used in `App.tsx` routing setup. It checks the user's authentication state from `AuthContext`. If the user is not logged in, it redirects them to the `/auth` page.
-   `Supabase Auth`: The underlying service handling user accounts, sessions, and password management.

**Flow:**
1.  User visits the site. `AuthGuard` checks `AuthContext`.
2.  If not logged in, user is redirected to `/auth`.
3.  User submits login/signup form on `Auth.tsx`.
4.  Form submission calls functions provided by `AuthContext` (e.g., `signInWithPassword`, `signUp`).
5.  `AuthContext` functions call the corresponding `supabase.auth` methods (e.g., `supabase.auth.signInWithPassword(...)`).
6.  On successful authentication, Supabase Auth sets session cookies/tokens. `AuthContext` listens for auth state changes (`onAuthStateChange`) and updates its internal state (user, session, loading).
7.  `AuthGuard` now detects the logged-in state and allows access to protected routes.

### Pitch Deck Analysis

**Goal:** Provide tools or insights related to startup pitch decks (Details limited in provided docs).

**Key Components:**
-   `src/pages/PitchDeckAnalysis.tsx`: Main page for this feature.
-   `src/components/pitch-deck/`: Contains components specific to this feature.

**Functionality:** (Speculative based on name) Might involve uploading pitch decks, analyzing content (potentially using AI/external APIs), providing feedback, or comparing against templates/best practices. Requires further investigation of the component implementations.

### Settings

**Goal:** Allow users to manage their profile and company settings.

**Key Components:**
-   `src/pages/Settings.tsx`: Main page, likely using tabs or sections for different settings categories (User Profile, Company Details, Notifications, etc.).
-   `src/components/settings/`: Contains components specific to settings forms/displays.
-   `src/hooks/useSettingsData.ts`: Hook potentially managing fetching and updating settings data.
-   `src/hooks/useCompanyForm.ts`: Specific hook for managing the Company Details form.

**Data Interaction:** Interacts with `profiles` and `companies` tables primarily.

## 9. Database Architecture

### Supabase Tables Detailed

1.  **`profiles`**: Stores extended user information beyond Supabase Auth.
    -   `id` (uuid, PK): Links to `auth.users.id`.
    -   `username` (text): Display name.
    -   `full_name` (text): User's full name.
    -   `avatar_url` (text): URL to profile picture.
    -   `updated_at` (timestampz): Last update timestamp.
    -   *(Other profile-specific fields)*

2.  **`companies`**: Core table holding information about the user's startup.
    -   `id` (uuid, PK): Unique identifier for the company.
    -   `owner_id` (uuid, FK -> profiles.id): User who owns/created the company record.
    -   `name` (text): Company name.
    -   `industry` (text): Industry sector.
    -   `founded_year` (integer): Year the company was founded.
    -   `stage` (text): Current funding stage (e.g., 'Pre-seed', 'Seed', 'Growth'). Crucial for valuation weighting.
    -   `total_employees` (integer): Number of employees.
    -   `business_activity` (text): Description of the company's business.
    -   `last_revenue` (numeric): Last reported annual revenue.
    -   `website_url` (text): Company website.
    -   `country` (text): Country of operation.
    -   `currency` (text): Primary currency used.
    -   `sector` (text): Specific market sector.
    -   `company_series` (text): Current funding series (e.g., 'A', 'B').
    -   `created_at` (timestampz): Record creation timestamp.
    -   `updated_at` (timestampz): Last update timestamp.

3.  **`valuations`**: Stores results and key inputs related to valuation calculations.
    -   `id` (uuid, PK): Unique identifier for a valuation record/instance.
    -   `company_id` (uuid, FK -> companies.id): Links to the company being valued.
    -   `selected_valuation` (numeric): The final valuation amount selected/adjusted by the user.
    -   `pre_money_valuation` (numeric): Calculated valuation before investment. Often same as `selected_valuation`.
    *   `investment` (numeric): Amount of investment in the current round. Calculated based on `selected_valuation`.
    *   `post_money_valuation` (numeric): Calculated valuation after investment (`pre_money + investment`).
    *   `initial_estimate` (numeric): An initial estimated valuation (source TBD - potentially default or early input).
    *   `valuation_min` (numeric): Lower bound for the valuation slider/range.
    *   `valuation_max` (numeric): Upper bound for the valuation slider/range.
    *   `funds_raised` (numeric): Total funds raised historically (may need updating).
    *   `last_year_ebitda` (numeric): Earnings Before Interest, Taxes, Depreciation, and Amortization for the last year. Input for DCF Multiple method.
    *   `industry_multiple` (numeric): Relevant industry multiple used in DCF Multiple calculation.
    *   `annual_roi` (numeric): Annual Required Rate of Return or Growth Rate expectation. Used in DCF Growth and Venture Cap methods.
    *   `calculation_date` (timestampz, nullable): Date when the calculation was last performed. (Made optional to fix type error).
    *   `created_at` (timestampz): Record creation timestamp.
    *   `updated_at` (timestampz): Last update timestamp.
    *   **Note:** Does *not* store the individual results of the 5 methods (Scorecard, Checklist, etc.). Those are handled in application state (`useValuation`).

4.  **`questionnaires`**: Metadata container for a set of questionnaire responses linked to a valuation.
    -   `id` (uuid, PK): Unique identifier for a questionnaire instance.
    *   `valuation_id` (uuid, FK -> valuations.id): Links to the specific valuation this questionnaire is for.
    *   `user_id` (uuid, FK -> profiles.id): User who completed the questionnaire.
    *   `completed_at` (timestampz, nullable): Timestamp when completed.
    *   `created_at` (timestampz): Record creation timestamp.

5.  **`questionnaire_questions`**: Stores answers to individual questions within a questionnaire.
    -   `id` (uuid, PK): Unique identifier for a question response.
    *   `questionnaire_id` (uuid, FK -> questionnaires.id): Links to the parent questionnaire.
    *   `question_number` (text): Identifier for the question (e.g., "1.1", "6.3"). Used to retrieve specific answers.
    *   `question` (text): The text of the question asked.
    *   `response` (text, nullable): The user's answer, stored as text regardless of original type. Needs parsing in the application.
    *   `response_type` (text): The type of input expected (e.g., 'dropdown', 'number', 'text').
    *   `created_at` (timestampz): Record creation timestamp.

6.  **`investments`**: Tracks details of specific funding rounds or investments.
    -   `id` (uuid, PK): Unique identifier for the investment.
    *   `company_id` (uuid, FK -> companies.id): Company receiving investment.
    *   `shareholder_id` (uuid, FK -> shareholders.id): Investing shareholder.
    *   `capital_invested` (numeric): Amount of capital invested.
    *   `number_of_shares` (integer): Number of shares issued/bought.
    *   `investment_date` (date): Date of the investment.
    *   `round_name` (text): Name of the funding round (e.g., 'Seed', 'Series A').
    *   `created_at` (timestampz): Record creation timestamp.

7.  **`shareholders`**: Stores information about individuals or entities holding shares.
    -   `id` (uuid, PK): Unique identifier for the shareholder.
    *   `company_id` (uuid, FK -> companies.id): Company they hold shares in.
    *   `name` (text): Name of the shareholder.
    *   `contact` (text): Contact information.
    *   `invested_amount` (numeric): Total amount invested by this shareholder.
    *   `share_count` (integer): Total number of shares held.
    *   `share_class` (text): Class of shares held (e.g., 'Common', 'Preferred').
    *   `created_at` (timestampz): Record creation timestamp.

8.  **`performance_metrics`**: Defines the metrics available for tracking.
    -   `id` (uuid, PK): Unique identifier for the metric definition.
    *   `name` (text): Name of the metric (e.g., "Revenue", "Gross Margin", "CAC").
    *   `unit` (text): Unit of measurement (e.g., "USD", "%", "Count").
    *   `description` (text, nullable): Explanation of the metric.
    *   `is_default` (boolean): Indicates if it's a standard metric offered by the platform.
    *   `user_id` (uuid, nullable, FK -> profiles.id): Links to the user if it's a custom metric.

9.  **`performance_values`**: Stores the actual recorded values for metrics over time.
    -   `id` (uuid, PK): Unique identifier for the value record.
    *   `metric_id` (uuid, FK -> performance_metrics.id): Links to the metric being recorded.
    *   `company_id` (uuid, FK -> companies.id): Company the metric belongs to.
    *   `month` (integer): Month the value was recorded for (1-12).
    *   `year` (integer): Year the value was recorded for.
    *   `actual` (numeric, nullable): The actual measured value.
    *   `target` (numeric, nullable): The target/goal value for that period.
    *   `created_at` (timestampz): Record creation timestamp.
    *   `updated_at` (timestampz): Last update timestamp.

10. **`user_benchmarks`**: Stores user-defined overrides for industry benchmarks used in scoring.
    -   `id` (uuid, PK): Unique identifier.
    *   `user_id` (uuid, FK -> profiles.id): User who set the custom benchmark.
    *   `metric_name` (text): Name of the metric being benchmarked (e.g., 'avg_revenue', 'avg_growth_rate'). Should match keys used in `calculateScore.ts`.
    *   `value` (numeric): The custom benchmark value set by the user.
    *   `industry` (text, nullable): Optionally specifies the industry this benchmark applies to.
    *   `created_at` (timestampz): Record creation timestamp.

11. **`folders`** (Potentially unused by Data Room UI): Database table for folder metadata.
    -   `id` (uuid, PK): Unique identifier.
    *   `name` (text): Folder name.
    *   `parent_id` (uuid, nullable, FK -> folders.id): Links to parent folder for hierarchy.
    *   `owner_id` (uuid, FK -> profiles.id): User who created the folder.
    *   `created_at` (timestampz): Record creation timestamp.
    *   **Note:** The Data Room UI primarily interacts with Storage API prefixes, not this table. This might be for other features or future use.

12. **`files`** (Potentially unused by Data Room UI): Database table for file metadata.
    -   `id` (uuid, PK): Unique identifier.
    *   `name` (text): File name.
    *   `description` (text, nullable): User-added description.
    *   `folder_id` (uuid, FK -> folders.id): Links to the database folder record.
    *   `storage_path` (text): The full path to the file in Supabase Storage (`data_room` bucket).
    *   `file_size` (integer): File size in bytes.
    *   `file_type` (text): MIME type of the file (e.g., 'application/pdf').
    *   `owner_id` (uuid, FK -> profiles.id): User who uploaded the file.
    *   `created_at` (timestampz): Record creation timestamp.
    *   **Note:** The Data Room UI primarily interacts with Storage API paths, not this table. This might be for searching, permissions, or other features.

### Table Relationships
-   `profiles` <-> `companies` (One-to-Many: One user owns many companies, though likely restricted to one active company per user in practice)
-   `companies` <-> `valuations` (One-to-Many: One company has many valuation records/snapshots)
-   `valuations` <-> `questionnaires` (One-to-Many: One valuation can have multiple questionnaire attempts, though likely one primary)
-   `questionnaires` <-> `questionnaire_questions` (One-to-Many: One questionnaire contains many question responses)
-   `companies` <-> `shareholders` (One-to-Many)
-   `companies` <-> `investments` (One-to-Many)
-   `shareholders` <-> `investments` (One-to-Many)
-   `companies` <-> `performance_values` (One-to-Many)
-   `performance_metrics` <-> `performance_values` (One-to-Many)
-   `profiles` <-> `performance_metrics` (One-to-Many for custom metrics)
-   `profiles` <-> `user_benchmarks` (One-to-Many)
-   `profiles` <-> `folders` (One-to-Many)
-   `profiles` <-> `files` (One-to-Many)
-   `folders` <-> `files` (One-to-Many)
-   `folders` <-> `folders` (Self-referencing for parent/child hierarchy)

### Row-Level Security (RLS)
-   RLS policies are crucial for ensuring data privacy and security in a multi-tenant application (even if currently single-company focused).
-   Policies are typically defined directly in Supabase SQL editor or via migrations.
-   **Common Patterns:**
    *   Users can only SELECT/INSERT/UPDATE/DELETE data related to their `auth.uid()`.
    *   Access might be based on linking tables (e.g., a `company_users` table mapping users to companies they can access).
    *   Example provided in original docs is good: Check if `auth.uid()` is in a related table (`company_users`) linked to the target row (`companies`).

### Supabase Storage
-   A dedicated bucket named `data_room` is used for the Data Room feature.
-   Files are organized using prefixes (paths) within the bucket (e.g., `folderA/subFolderB/document.pdf`).
-   Access control is typically managed via Storage RLS policies defined in Supabase, often mirroring database RLS logic (e.g., allowing users to access files/folders linked to their user ID or company ID).

## 10. State Management

State management is handled through a combination of TanStack Query for server state and React Context/useState for client state.

### TanStack Query (React Query)
-   **Primary Use:** Managing server state fetched from Supabase (database tables and storage).
-   **Key Concepts Used:**
    *   `useQuery`: For fetching data. Requires a unique `queryKey` (often an array like `['valuation']` or `['storage', 'data_room', currentPath]`) and a `queryFn` (async function to fetch data). Handles caching, background refetching, loading/error states.
    *   `useMutation`: For creating, updating, or deleting data. Requires a `mutationFn` (async function performing the change). Provides `onSuccess` and `onError` callbacks for side effects like cache invalidation and showing notifications.
    *   `QueryClient`: Manages the query cache. Used for invalidating queries (`queryClient.invalidateQueries`) after mutations to trigger refetches, or for directly setting query data (`queryClient.setQueryData`).
-   **Caching:** TanStack Query automatically caches fetched data based on the `queryKey`. Stale data might be shown initially while fresh data is fetched in the background. `staleTime` and `gcTime` (cacheTime) configure cache behavior.
-   **Data Synchronization:** Helps keep UI consistent with backend data through automatic refetching on events like window refocus, component mount, or after mutations.

### React Context API
-   **`AuthContext` (`src/contexts/AuthContext.tsx`):**
    *   Provides global access to the current user's authentication status (logged in/out), user profile data, and session information.
    *   Exposes functions for `signInWithPassword`, `signUp`, `signOut`.
    *   Listens to Supabase `onAuthStateChange` to automatically update state when the user logs in or out elsewhere or the session expires.
-   **Other Contexts (Potential):** Could be used for theme switching, application-wide settings, or other rarely changing global state. Avoid overuse for state that changes frequently or is only needed by a few components.

### Local Component State (useState)
-   Used for managing state that is local to a single component or a small group of closely related components.
-   Examples: Form input values before submission, UI state like modal visibility (`isOpen`), toggle states, current path in Data Room (`currentPath`, `folderPath`), slider value (`rangeValue`), drag state (`isDragging`).

## 11. Components Architecture

### Component Types
1.  **UI Primitives (`src/components/ui/`)**: Basic, unstyled or minimally styled building blocks imported from `shadcn/ui` (e.g., `Button`, `Input`, `Card`, `Dialog`, `Tooltip`). These are the foundation.
2.  **Composite Components (`src/components/` subfolders)**: Combine UI primitives and potentially other composite components to create more complex, feature-specific UI elements (e.g., `FinancialMetricCard`, `BenchmarkComparisonCard`, `AddDocumentDialog`). These encapsulate specific functionality or views.
3.  **Page Components (`src/pages/`)**: Represent entire application screens or routes. They orchestrate the layout and interaction of multiple composite components, often fetching data using hooks and passing it down.

### Key Components Deep Dive
-   **`Layout.tsx`**: Defines the overall structure of the authenticated application view. Typically includes:
    *   `SidebarNav.tsx`: Renders the main navigation menu.
    *   `TopBar.tsx`: Displays the header, potentially with user menu, notifications, search.
    *   Main content area: Renders the active page component passed via `react-router-dom`'s `<Outlet />`.
-   **`ValuationContent.tsx`**: As detailed in [Core Features](#core-features--implementation), responsible for the interactive valuation analysis display. Uses `useValuation` hook extensively. Renders charts using `Recharts`.
-   **`BenchmarksContent.tsx`**: Displays the startup score and benchmark comparisons. Uses `useStartupScore` hook. Renders charts/tables.
-   **`Data.tsx`**: Implements the file browser interface for the Data Room. Manages path state, interacts directly with Supabase Storage via `useQuery` (`list`) and `useMutation` (`upload`, `remove`, `download`).
-   **`FinancialOverview.tsx`**: Acts as a container using `Tabs` to host various performance-related components (`DefaultMetricsTab`, `PerformanceTab`, etc.). Fetches overview data.

## 12. Routing

-   Client-side routing is handled by `react-router-dom`.
-   Routes are defined within `src/App.tsx`, typically using `<BrowserRouter>`, `<Routes>`, and `<Route>` components.
-   Nested routes might be used for sections like Valuation or Settings.
-   Protected routes requiring authentication are wrapped with the `AuthGuard` component.
    ```tsx
    // Example in App.tsx
    <Route element={<AuthGuard />}>
      <Route element={<Layout />}> // Apply main layout to protected routes
        <Route path="/" element={<Dashboard />} />
        <Route path="/financial-overview" element={<FinancialOverview />} />
        <Route path="/valuation" element={<Valuation />} />
        {/* ... other protected routes */}
      </Route>
    </Route>
    <Route path="/auth" element={<Auth />} />
    ```

## 13. Integration Points

### Supabase Integration
-   **Client Initialization (`src/integrations/supabase/client.ts`):** Creates the Supabase client instance using URL and Anon Key from environment variables. This client is imported and used throughout the application for database, auth, and storage interactions.
-   **Type Safety (`src/integrations/supabase/types.ts`):** Auto-generated types provide compile-time checks and autocomplete for database operations when using the Supabase client, reducing runtime errors. Generated using `supabase gen types typescript`.
-   **Environment Variables:** Securely handled via `.env` locally and Vercel environment variable settings in deployment.

## 14. Development Practices

### Coding Style & Linting
-   **TypeScript:** Used throughout for static typing.
-   **ESLint & Prettier:** (Assumed) Standard tools for enforcing code style consistency and catching common errors. Configuration likely in `.eslintrc.js` / `.prettierrc.js`.
-   **Component Naming:** PascalCase (e.g., `ValuationContent`).
-   **Hook Naming:** camelCase, prefixed with `use` (e.g., `useValuation`).
-   **File Naming:** Consistent with component/hook name (e.g., `ValuationContent.tsx`, `useValuation.ts`).

### Error Handling
-   **Data Fetching:** TanStack Query handles loading and error states automatically. Errors can be accessed from `useQuery` / `useMutation` results (`error` property).
-   **Mutations:** `onError` callbacks in `useMutation` are used to display user-friendly error messages via toasts.
-   **General Errors:** `try...catch` blocks are used for critical operations or where specific error handling is needed. Errors are logged to the console and user-facing messages are shown via toasts. Component error boundaries could be implemented for more robust UI error handling.

### Form Validation
-   **React Hook Form:** Manages form state, submission, and validation status.
-   **Zod:** Defines validation schemas (`src/schemas/`).
-   **`@hookform/resolvers/zod`:** Connects Zod schemas to React Hook Form for seamless validation. Errors are displayed near the relevant form fields.

### API/Data Layer Interaction
-   All direct interactions with Supabase (DB, Auth, Storage) should ideally be encapsulated within hooks (`useQuery`, `useMutation`) or specific library functions (`src/lib/`).
-   Avoid direct Supabase calls within UI components where possible; prefer using custom hooks that provide the data or mutation functions.
-   Use the auto-generated Supabase types (`Database` type from `types.ts`) for type-safe database queries.

## 15. Deployment

-   **Platform:** Vercel.
-   **Process:**
    1.  Connect the GitHub repository to a Vercel project.
    2.  Configure the Framework Preset to `Vite`.
    3.  Set the Root Directory (usually `./`).
    4.  Configure Build Command (Vercel usually detects `npm run build` or `yarn build`).
    5.  Configure Output Directory (Vercel usually detects `dist`).
    6.  **Crucially:** Add all required [Environment Variables](#environment-variables) (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to the Vercel project settings.
    7.  Ensure the `vercel.json` file with the SPA rewrite rule exists in the root of the repository (see below).
    8.  Deployments are typically triggered automatically on pushes to the main branch (or configured branches).
-   **SPA Handling (`vercel.json`):**
    ```json
    {
      "rewrites": [
        {
          "source": "/((?!api|.*\.\w+).*)",
          "destination": "/index.html"
        }
      ]
    }
    ```
    This file is necessary in the project root to ensure direct navigation to sub-routes (e.g., `/financial-overview`) works correctly by serving the `index.html` file for all non-asset/non-API requests.

## 16. Potential Future Enhancements

-   More sophisticated AI/ML features for pitch deck analysis or financial forecasting.
-   Advanced cap table modeling (convertible notes, SAFEs, waterfall analysis).
-   Integration with accounting software (QuickBooks, Xero).
-   Investor relationship management (CRM) features.
-   Customizable reporting and dashboards.
-   Team collaboration features (multi-user access control per company).
-   Real-time notifications for metric updates or tasks.
-   Mobile application.

## 17. Glossary

-   **Benchmarking:** Comparing a startup's performance metrics against industry standards or peers.
-   **Cap Table (Capitalization Table):** A spreadsheet or table detailing the equity ownership of a company, including shares, options, and convertible notes.
-   **Checklist Method:** A valuation approach based on comparing a startup against a predefined list of success factors.
-   **DCF (Discounted Cash Flow):** A valuation method used to estimate the value of an investment based on its expected future cash flows discounted back to their present value.
-   **EBITDA:** Earnings Before Interest, Taxes, Depreciation, and Amortization. A measure of a company's operating profitability.
-   **ESOP (Employee Stock Ownership Plan):** A benefit plan that gives workers ownership interest in the company.
-   **Post-Money Valuation:** The value of a company *after* an external investment has been added to its balance sheet.
-   **Pre-Money Valuation:** The value of a company *before* it receives external investment.
-   **RLS (Row-Level Security):** Database security feature restricting access to rows based on user roles or attributes.
-   **Scorecard Method:** A valuation approach comparing a startup to typical valuations of similar companies, adjusting based on factors like team, market, and product.
-   **SPA (Single Page Application):** A web application that interacts with the user by dynamically rewriting the current web page with new data from the web server, instead of the default method of the browser loading entire new pages.
-   **Supabase:** An open-source Backend-as-a-Service platform.
-   **TanStack Query (React Query):** A library for managing server state in React applications.
-   **Venture Capital Method:** A valuation method estimating terminal value at exit and discounting back based on required ROI.
-   **Vite:** A modern frontend build tool.
-   **Zod:** A TypeScript-first schema declaration and validation library.


