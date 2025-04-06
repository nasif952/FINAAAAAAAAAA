# DiamondAI - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Stack](#technical-stack)
3. [Project Structure](#project-structure)
4. [Core Features & Implementation](#core-features--implementation)
5. [Database Architecture](#database-architecture)
6. [State Management](#state-management)
7. [Components Architecture](#components-architecture)
8. [Valuation System](#valuation-system)
9. [Benchmarking System](#benchmarking-system)
10. [Performance Tracking](#performance-tracking)
11. [Authentication](#authentication)
12. [Data Room System](#data-room-system)
13. [Integration Points](#integration-points)
14. [Development Practices](#development-practices)

## Project Overview

DiamondAI is a comprehensive startup management platform designed to help founders track metrics, manage valuations, and handle investor relations. The application's standout feature is its multi-faceted valuation methodology that combines five different approaches to provide a balanced startup valuation.

### Business Logic

The core business logic centers on:
- Generating accurate startup valuations through multiple methodologies
- Tracking and benchmarking financial metrics over time
- Managing cap tables and investor relationships
- Providing data-driven insights for decision-making
- Facilitating due diligence processes
- Secure document management via a dedicated Data Room feature

## Technical Stack

### Frontend
- **React 18.3.1**: Core UI library
- **TypeScript**: For type safety across the codebase
- **Vite 5.4.1**: Build tool and development server
- **TailwindCSS 3.4.11**: Utility-first CSS framework for styling
- **shadcn/ui**: Component library based on Radix UI primitives
- **Lucide Icons**: SVG icon library for consistent iconography
- **React Router 6.26.2**: For application routing

### State Management & Data Fetching
- **TanStack Query 5.56.2**: For data fetching, caching, and state management
- **React Context API**: For global state (auth, theme, etc.)
- **Zod 3.23.8**: Schema validation library for form and data validation
- **React Hook Form 7.53.0**: Form handling with validation integration

### Data Visualization
- **Recharts 2.15.1**: For creating responsive charts and graphs

### Backend & Database
- **Supabase 2.49.3**: Backend-as-a-Service platform providing:
  - PostgreSQL database
  - Authentication services
  - Row-level security
  - Real-time subscriptions
  - Storage solutions for file management (used directly by the Data Room feature)

## Project Structure

The project follows a feature-based organization with shared components and utilities:

```
src/
├── components/             # Reusable UI components
│   ├── ui/                 # Basic UI elements from shadcn/ui
│   ├── valuation/          # Valuation-specific components
│   ├── settings/           # Settings-related components
│   ├── pitch-deck/         # Pitch deck analysis components
│   ├── performance/        # Performance tracking components
│   ├── investor/           # Investor-related components
│   ├── dialogs/            # Modal dialogs and popups
│   │   ├── AddDocumentDialog.tsx     # File upload dialog (Data Room)
│   │   ├── CreateFolderDialog.tsx    # Folder creation dialog (Data Room)
│   │   └── EditDocumentMetadataDialog.tsx  # (Potentially reusable, not primary in Data Room)
│   ├── Button.tsx          # Custom button component
│   ├── TopBar.tsx          # Application top navigation bar
│   ├── SidebarNav.tsx      # Application sidebar navigation
│   ├── Card.tsx            # Card container component
│   ├── StepProgress.tsx    # Progress indicator for multi-step processes
│   ├── DataTable.tsx       # Table component for data display
│   ├── AuthGuard.tsx       # Authentication protection wrapper
│   ├── Layout.tsx          # Main application layout
│   └── ProgressBar.tsx     # Progress visualization component
│
├── contexts/               # React contexts for global state
│   └── AuthContext.tsx     # Authentication state management
│
├── hooks/                  # Custom React hooks
│   ├── useValuation.ts     # Valuation data management
│   ├── useStartupScore.ts  # Scoring calculation and management
│   ├── useQuestionnaireData.ts # Questionnaire data handling
│   ├── useSettingsData.ts  # User settings management
│   ├── useFileUpload.ts    # General file upload hook (may differ from Data Room specifics)
│   ├── useCompanyForm.ts   # Company form handling
│   ├── use-mobile.tsx      # Responsive design helper
│   └── use-toast.ts        # Toast notification management
│
├── lib/                    # Core business logic & utilities
│   ├── valuationCalculator.ts # Valuation algorithm implementations
│   ├── calculateScore.ts   # Scoring system implementation
│   ├── formatters.ts       # Data formatting utilities
│   └── utils.ts            # General utility functions
│
├── pages/                  # Application routes and pages
│   ├── valuation/          # Valuation-related page components
│   │   ├── ValuationContent.tsx  # Main valuation display
│   │   ├── BenchmarksContent.tsx # Benchmarking interface
│   │   ├── QuestionnaireContent.tsx # Valuation questionnaire
│   │   └── HistoryContent.tsx    # Valuation history tracking
│   ├── Auth.tsx            # Authentication pages (login/signup)
│   ├── CapTable.tsx        # Cap table management
│   ├── Dashboard.tsx       # Main application dashboard
│   ├── Valuation.tsx       # Valuation page wrapper
│   ├── Settings.tsx        # User and company settings
│   ├── Performance.tsx     # (DEPRECATED - Functionality moved to FinancialOverview)
│   ├── PitchDeckAnalysis.tsx # Pitch deck review tools
│   ├── InvestorDashboard.tsx # Investor-facing dashboard
│   ├── FinancialOverview.tsx # Financial data overview & performance tracking
│   ├── DueDiligence.tsx    # Due diligence process management
│   ├── Data.tsx            # Secure document sharing (uses Supabase Storage API)
│   ├── Index.tsx           # Landing/home page
│   └── NotFound.tsx        # 404 error page
│
├── integrations/           # External service integrations
│   └── supabase/           # Supabase integration
│       ├── client.ts       # Supabase client initialization
│       ├── client-extension.ts # Extended client functionality (if used)
│       └── types.ts        # TypeScript definitions for database (auto-generated)
│
├── schemas/                # Data validation schemas
│   └── companySchema.ts    # Company data validation
│
├── utils/                  # Utility functions (consider merging with lib/ or specific features)
│
├── App.tsx                 # Application root component
├── App.css                 # Global styles (less preferred)
├── index.css               # TailwindCSS imports & base styles
├── main.tsx                # Application entry point
└── vite-env.d.ts           # Vite environment type definitions
```

## Core Features & Implementation

### Valuation System

The valuation system is the cornerstone of the application, implementing five different valuation methodologies:

1. **Scorecard Method**: Compares the startup to similar funded companies with adjustment factors for team strength, market opportunity, etc.
2. **Checklist Method**: Evaluates the startup against a comprehensive list of success criteria
3. **Venture Capital Method**: Calculates valuation based on expected ROI and potential exit value
4. **DCF with Long-Term Growth**: Discounted cash flow analysis with terminal growth assumptions
5. **DCF with Multiples**: Discounted cash flow analysis with industry-specific multiples

#### Implementation Details

- **Calculation Engine**: `src/lib/valuationCalculator.ts` (682 lines) contains all valuation algorithms and normalization logic
- **Questionnaire System**: `src/hooks/useQuestionnaireData.ts` manages questionnaire state and responses
- **Valuation State**: `src/hooks/useValuation.ts` provides valuation data and methods for the UI
- **Weighting System**: Each method is weighted based on company stage (pre-seed, seed, growth, etc.)
- **Visual Representation**: `src/pages/valuation/ValuationContent.tsx` renders interactive valuation charts and sliders

#### Valuation Data Flow
1. User completes questionnaire via `QuestionnaireContent.tsx`
2. `useValuation` hook triggers calculation via `calculateValuation` function
3. `valuationCalculator.ts` processes inputs through each methodology
4. Results are normalized to handle extreme value differences
5. Combined valuation is calculated using weighted average
6. Results are stored in Supabase `valuations` table
7. UI updates with interactive visualization in `ValuationContent.tsx`

### Benchmarking System

The benchmarking system allows startups to compare their metrics against industry standards:

- **Implementation**: `src/pages/valuation/BenchmarksContent.tsx` and `src/hooks/useStartupScore.ts`
- **Metrics Tracked**: Revenue, gross margin, team size, valuation, growth rate, cash on hand, ROI, and market size
- **Scoring Algorithm**: Compares user values against benchmarks with category weighting
- **Performance Score**: Aggregated score (0-100) with breakdowns by category

### Data Sources and Priority

The scoring system strictly prioritizes data in the following order:
1. Questionnaire inputs - Values from the valuation questionnaire are used as the primary source of truth
2. Default values - System defaults are used if no questionnaire data is available

The application no longer uses Performance metrics as a fallback source for benchmarking calculations, ensuring that only user-provided questionnaire data or system defaults are used.

### Key Questionnaire Inputs Used
- Team size (Q1.1 + Q1.6): Combines founders count and employees count
- Revenue (Q6.1): Annual revenue 
- Growth rate (Q6.3): Revenue growth rate year-over-year
- Cash on hand (Q6.4 + Q6.5): Calculated from burn rate × runway
- Profit margin/ROI (Q6.6): Annual return on investment
- Market size (Q3.1): Total addressable market
- Product readiness: Calculated from product stage (Q2.1), product-market fit (Q2.7), and scalability (Q2.9)
- Expected valuation (Q7.8): User's own valuation expectation

For the most accurate scoring, entrepreneurs should ensure their questionnaire contains complete and up-to-date financial information.

### Cap Table Management

The cap table management system helps founders track equity and investments:

- **Implementation**: `src/pages/CapTable.tsx` (873 lines)
- **Features**:
  - Shareholder management
  - Funding round tracking
  - ESOP (Employee Stock Ownership Plan) management
  - Investment tracking
  - Share price calculation
  - Equity dilution visualization
  - Investor dashboard integration (as a subtab)

## Database Architecture

### Supabase Tables

1. **profiles**
   - Stores user profile information
   - Linked to auth.users via RLS policies

2. **companies**
   - Central table for company information
   - Fields: name, industry, founded_year, stage, total_employees, etc.
   - One-to-many relationship with other entities

3. **valuations**
   - Stores valuation history and calculations
   - Fields:
     - selected_valuation: User-selected final valuation
     - pre_money_valuation: Calculated pre-money value
     - investment: Current round investment amount
     - post_money_valuation: Value after investment
     - valuation_min/max: Range boundaries
     - annual_roi: Expected annual return on investment
   - Foreign key to companies table

4. **questionnaires**
   - Stores questionnaire metadata
   - Linked to valuations via valuation_id

5. **questionnaire_questions**
   - Stores individual question responses
   - Fields: question_number, question, response, response_type
   - Organized by category (team, product, market, etc.)
   - Foreign key to questionnaires table

6. **investments**
   - Tracks investment rounds and capital
   - Fields: capital_invested, number_of_shares, investment_date
   - Foreign key to companies and shareholders tables

7. **shareholders**
   - Stores investor information
   - Fields: name, contact, invested amount, share count, percentage

8. **performance_metrics**: Defines trackable metrics (both default and potentially custom).
9. **performance_values**: Stores actual metric values over time, linked to `performance_metrics`.

10. **user_benchmarks**
    - Stores custom benchmark values for each user
    - Allows personalization of scoring system

11. **folders**
    - Stores folder structure for the data room
    - Fields: name, parent_id, owner, created_at
    - Enables hierarchical organization of files

12. **files**
    - Stores file metadata for uploaded documents
    - Fields: name, description, folder_id, storage_path, file_size, file_type, owner, created_at
    - Links to physical files stored in Supabase Storage

### Row-Level Security

The application implements Supabase's Row-Level Security for data protection:

```sql
-- Example RLS policy for companies table
CREATE POLICY "Users can only access their own companies" ON companies
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM company_users WHERE company_id = id
  ));
```

## State Management

### Authentication Context
Located in `src/contexts/AuthContext.tsx` (141 lines), manages:
- User authentication state
- Login/logout operations
- Profile information
- Session persistence
- Access control

### Valuation Hook
The `useValuation` hook in `src/hooks/useValuation.ts` (273 lines) manages:
- Fetching valuation data
- Calculation status tracking (idle, calculating, error)
- Selected valuation updating
- Recalculation triggering
- Questionnaire completion checking

```typescript
// Key types in useValuation
interface ValuationMethods {
  scorecard: number;
  checklistMethod: number;
  ventureCap: number;
  dcfGrowth: number;
  dcfMultiple: number;
  weights: Record<string, { weight: number; enabled: boolean }>;
}

interface UseValuationReturn {
  valuation: ValuationData | null;
  isLoading: boolean;
  error: Error | null;
  calculationStatus: 'idle' | 'calculating' | 'error';
  isQuestionnaireComplete: boolean;
  hasFinancialsData: boolean;
  updateSelectedValuation: (value: number) => void;
  recalculateValuation: () => void;
}
```

### Startup Scoring Hook
The `useStartupScore` hook in `src/hooks/useStartupScore.ts` (287 lines) manages:
- Performance metric calculation
- Benchmark comparisons
- Score aggregation
- Category score calculation

### Data Fetching Pattern
Uses TanStack Query for data management with consistent patterns:

```typescript
// Example query pattern
const { data, isLoading, error } = useQuery({
  queryKey: ['valuation', valuationId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('valuations')
      .select('*, companies(*)')
      .eq('id', valuationId)
      .single();
      
    if (error) throw error;
    return data;
  }
});

// Example mutation pattern
const mutation = useMutation({
  mutationFn: async (newValue: number) => {
    const { error } = await supabase
      .from('valuations')
      .update({ selected_valuation: newValue })
      .eq('id', valuationId);
      
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['valuation'] });
    toast.success('Valuation updated successfully');
  },
  onError: (error) => {
    toast.error(`Error updating valuation: ${error.message}`);
  }
});
```

## Components Architecture

### UI Component Structure
Components follow a clear hierarchy:
- **Primitive Components**: Basic UI elements from shadcn/ui (Button, Input, Card, etc.)
- **Composite Components**: Domain-specific combinations of primitives
- **Page Components**: Full page layouts combining multiple composites

### ValuationContent Component

The `ValuationContent` component in `src/pages/valuation/ValuationContent.tsx` (631 lines) implements:
1. Valuation summary display with company information
2. Interactive slider for manual valuation adjustment
3. Visual representation of all five valuation methods
4. Current funding round information with investment calculation
5. Method weight visualization based on company stage

Key implementation features:
- Responsive visualizations for different screen sizes
- Interactive elements for valuation adjustments
- Real-time calculations for investment and post-money valuation
- Detailed breakdown of each valuation method's result

### BenchmarksContent Component

The `BenchmarksContent` component in `src/pages/valuation/BenchmarksContent.tsx` (418 lines) implements:
1. Benchmark values display for key metrics
2. Performance score calculation and visualization
3. Category score breakdown
4. Detailed metrics analysis with comparison to benchmarks

### FinancialOverview Component (`src/pages/FinancialOverview.tsx`)
This page now serves as the central hub for financial data and performance tracking.
-   Uses `Tabs` to organize content into:
    -   Overview (cards, charts)
    -   Update Metrics (`DefaultMetricsTab`)
    -   Performance History (`PerformanceTab`)
    -   Metric Definitions (`CustomMetricsTab`)
-   Fetches core data needed for the overview tab using `useQuery`.
-   Individual tabs may manage their own specific state and data fetching/mutations.

## Data Room System (Storage API Based)

The Data Room module (`src/pages/Data.tsx`) provides secure document management directly interacting with the **`data_room` Supabase Storage bucket**. It allows users to browse, upload, download, and delete files and folders.

**Note:** This implementation *does not* rely on the `files` or `folders` database tables for its core functionality. It reads the structure directly from the storage bucket.

### Key Components

1. **Data Page Component** (`src/pages/Data.tsx`, ~400+ lines):
   - Implements the main UI for file/folder browsing.
   - Uses `supabase.storage.from('data_room').list(currentPath)` via `useQuery` to fetch items.
   - Manages navigation state using `currentPath` (string representing the storage prefix) and `folderPath` (array for breadcrumbs).
   - Displays items in a table, distinguishing between files and folders (prefixes).
   - Handles item selection using storage paths.
   - Provides client-side search filtering.

2. **AddDocumentDialog** (`src/components/dialogs/AddDocumentDialog.tsx`):
   - Accepts `currentPath` prop.
   - Uploads the selected file directly to Supabase Storage within the `currentPath` using `supabase.storage.from('data_room').upload(filePath, file)`.
   - Constructs `filePath` by combining `currentPath` and a unique filename.
   - Invalidates the storage query (`['storage', 'data_room', currentPath]`) on success.
   - *Optional*: Can be configured to also write metadata to the `files` database table if needed for other purposes.

3. **CreateFolderDialog** (`src/components/dialogs/CreateFolderDialog.tsx`):
   - Accepts `currentPath` prop.
   - Creates a "folder" in storage by uploading an empty placeholder file (e.g., `.placeholder`) to the desired prefix: `supabase.storage.from('data_room').upload(placeholderPath, ...)`. This makes the prefix appear in `list()` results.
   - Constructs the `placeholderPath` using `currentPath` and the sanitized folder name.
   - Invalidates the storage query (`['storage', 'data_room', currentPath]`) on success.
   - *Optional*: Can be configured to also write metadata to the `folders` database table.

### Implementation Details

#### Supabase Storage Interaction

- **Listing**: `supabase.storage.from('data_room').list(path)` is the primary method for fetching content.
- **Uploading**: `supabase.storage.from('data_room').upload(path, file)` for files and placeholder files.
- **Downloading**: `supabase.storage.from('data_room').download(path)`.
- **Deleting**: `supabase.storage.from('data_room').remove([paths])` handles both files and folder prefixes (deleting all objects under that prefix).

#### State Management

- `currentPath`: String state (`useState('')`) tracking the current folder prefix being viewed in the storage bucket (e.g., `''`, `'folderA'`, `'folderA/subFolderB'`).
- `folderPath`: Array state (`useState([{ name: 'Root' }])`) storing path segments for breadcrumb navigation.
- `selectedItems`: Array state (`useState([])`) storing the full storage paths of selected items for deletion.
- TanStack Query (`useQuery`, `useMutation`) manages fetching state, caching, and server interactions with the Storage API.

#### Key Functions in `Data.tsx`

- `navigateToFolder(folderName)`: Appends `folderName` to `currentPath`, updates `folderPath`, clears selection/search.
- `navigateBreadcrumb(index)`: Resets `currentPath` and `folderPath` based on the clicked breadcrumb index.
- `downloadFile(filePath, fileName)`: Calls `supabase.storage.from('data_room').download(filePath)`.
- `deleteItemsMutation`: Calls `supabase.storage.from('data_room').remove(selectedItems)`.
- `formatBytes`: Utility to format file sizes.

## Valuation System Technical Details

### Calculation Algorithms

The valuation calculation in `valuationCalculator.ts` implements these key methods:

1. **Scorecard Method**:
   ```typescript
   function calculateScorecardMethod(questions: QuestionWithResponse[]): number {
     // Base valuation for comparison (seed stage software startup average)
     const baseValuation = 5000000;
     
     // Factors to evaluate with weights
     const factors = {
       team: 0.3,           // Team quality and experience
       market: 0.25,        // Market size and growth
       product: 0.15,       // Product/technology uniqueness
       competition: 0.1,    // Competitive landscape
       businessModel: 0.1,  // Business model viability
       financials: 0.1      // Financial projections
     };
     
     // Calculate weighted average rating across all factors
     const weightedRating = calculateWeightedRating(questions, factors);
     
     // Apply the rating to the base valuation
     return baseValuation * weightedRating;
   }
   ```

2. **Checklist Method**:
   ```typescript
   function calculateChecklistMethod(questions: QuestionWithResponse[]): number {
     // Base valuation (pre-money)
     const baseValuation = 7500000;
     
     // Apply adjustments for each factor
     const totalAdjustment = calculateFactorAdjustments(questions);
     
     // Apply adjustment to base valuation
     return baseValuation * (1 + totalAdjustment);
   }
   ```

3. **Venture Capital Method**:
   ```typescript
   function calculateVentureCapMethod(questions: QuestionWithResponse[]): number {
     // Extract financial data from questionnaire
     const { lastYearRevenue, projectedRevenue, growthRate } = extractFinancialData(questions);
     
     // Calculate revenue multiple based on growth rate
     const revenueMultiple = calculateRevenueMultiple(growthRate);
     
     // Use projected revenue if available, otherwise use current revenue with growth
     const revenueToUse = projectedRevenue > 0 ? 
       projectedRevenue : 
       (lastYearRevenue * (1 + (growthRate / 100)));
     
     return revenueToUse * revenueMultiple;
   }
   ```

4. **DCF with Long-Term Growth**:
   ```typescript
   function calculateDCFGrowthMethod(questions: QuestionWithResponse[]): number {
     // Extract financial data
     const { lastYearRevenue, growthRate, profitMargin } = extractFinancialData(questions);
     
     // Calculate DCF over projection period (5 years)
     let valuation = calculateDiscountedCashFlows(
       lastYearRevenue, 
       growthRate, 
       profitMargin,
       5,  // projection years
       0.25 // discount rate
     );
     
     // Add terminal value with perpetual growth
     valuation += calculateTerminalValue(
       lastYearRevenue,
       growthRate,
       profitMargin,
       0.03, // terminal growth rate
       10,   // terminal multiple
       0.25, // discount rate
       5     // projection years
     );
     
     return Math.max(valuation, 0);
   }
   ```

5. **DCF with Multiples**:
   ```typescript
   function calculateDCFMultipleMethod(questions: QuestionWithResponse[]): number {
     // Extract financial data
     const { lastYearRevenue, profitMargin, industry } = extractFinancialData(questions);
     
     // Calculate EBITDA
     const ebitda = lastYearRevenue * (profitMargin / 100);
     
     // Determine industry multiple
     const industryMultiple = getIndustryMultiple(industry);
     
     // Apply multiple to EBITDA or revenue
     if (ebitda > lastYearRevenue * 0.05) {
       return ebitda * industryMultiple;
     } else {
       return lastYearRevenue * (industryMultiple * 0.8);
     }
   }
   ```

### Normalization Process

To handle extreme differences between valuation methods:

```typescript
function normalizeValuationMethodValues(values: Record<string, number>): Record<string, number> {
  // Find median value for reference
  const sortedValues = [...positiveValues].sort((a, b) => a - b);
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  
  // If extreme differences exist (max/min > 100), normalize
  if (maxValue / minValue > 100) {
    // Bring extreme values closer to median
    for (const key of Object.keys(result)) {
      const value = result[key];
      
      if (value < median * 0.01) {
        result[key] = median * 0.01;
      } else if (value > median * 100) {
        result[key] = median * 100;
      }
    }
  }
  
  return result;
}
```

## Authentication

Authentication implementation uses Supabase Auth with:
- Email/password authentication
- Session persistence via cookies
- Protected routes via AuthGuard component
- User profile management
- Role-based access control

## Integration Points

### Supabase Integration

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Extended client functionality is provided in `client-extension.ts` for typesafe queries.

The database schema types are defined in `types.ts` (1117 lines) for complete type safety when working with the database.

## Development Practices

### Error Handling Pattern
```typescript
try {
  // Operation that might fail
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  if (error instanceof Error) {
    console.error(`Specific error: ${error.message}`);
    toast.error(`Operation failed: ${error.message}`);
  } else {
    console.error('An unknown error occurred', error);
    toast.error('An unknown error occurred');
  }
  throw error; // Re-throw for component error boundaries
}
```

### Form Validation with Zod and React Hook Form
```typescript
// Schema definition
const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Please select an industry'),
  stage: z.string().min(1, 'Please select a company stage'),
  foundedYear: z.string().regex(/^\d{4}$/, 'Please enter a valid year')
});

// Form implementation
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(companySchema),
  defaultValues: { ... }
});
```

### Component Props Pattern
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

### Data Formatting Utilities
The application includes consistent formatters for data display:

```typescript
// src/lib/formatters.ts
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}
```

This ensures consistent data presentation throughout the application.

## Performance Tracking (Integrated into Financial Overview)

The functionality previously under a dedicated "Performance" page is now integrated as tabs within the **Financial Overview** page (`src/pages/FinancialOverview.tsx`). This provides a centralized location for viewing, updating, and analyzing key performance indicators (KPIs).

### Integrated Tabs within Financial Overview:

1.  **Overview**: Displays key financial metric cards and charts (original content of Financial Overview).
2.  **Update Metrics**: Allows users to input actual and target values for default metrics for specific months/years. Implemented by `src/components/performance/DefaultMetricsTab.tsx`.
3.  **Performance History**: Shows historical charts and potentially a table of past metric updates. Implemented by `src/components/performance/PerformanceTab.tsx`.
4.  **Metric Definitions**: Lists predefined metrics and potentially allows adding custom ones. Implemented by `src/components/performance/CustomMetricsTab.tsx`.

### Implementation Details:

-   **UI**: Uses the `Tabs` component from `shadcn/ui` within `FinancialOverview.tsx`.
-   **Data Fetching**: Leverages `useQuery` within `FinancialOverview.tsx` and potentially within the individual tab components (`DefaultMetricsTab` likely uses `useQuery` and `useMutation`) to fetch/update data from `performance_values` and `performance_metrics` tables.


