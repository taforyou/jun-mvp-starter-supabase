# Jun MVP Starter • migrated by taforyou

This is a starter project for building MVP (minimal viable product) for Thai users.
Based on the original work by (https://github.com/siriwatknp/jun-mvp-starter/)

The starter provides you:

- Authentication flow via Line login and store user to Supabase Auth.
- React Context and hook to get the status and data from the authentication flow.
- The user data is kept in Supabase database with Row Level Security (RLS) policies.
- Ready-to-use static site generation with Next.js that deploys on Cloudflare Pages.
- Configured TypeScript

## Demo

You can try the demo here for firebase: [Jun MVP starter demo](https://jun-mvp-starter.pages.dev)
You can try the demo here for supabase: [Jun MVP starter demo](https://jun-mvp-starter-supabase.pages.dev)

<!-- TODO: add a video -->

## Prerequisite

Before you begin, you'll need to set up the following accounts and services:

### GitHub account

1. Go to [GitHub.com](https://github.com) and click "Sign up"
2. Enter your email, create a password, and choose a username
3. Verify your account through the email you receive
4. Complete any additional verification steps if prompted

### Supabase project

1. Go to [Supabase Console](https://supabase.com/dashboard)
2. Click "New project" and enter a project name
3. Choose a database password and select a region (recommend `Southeast Asia (Singapore)`)
4. Click "Create new project" and wait for setup to complete
5. On the project dashboard, go to Settings > API to get your project URL and anon key
6. Enable Row Level Security (RLS):
   - Go to Authentication > Policies
   - The starter includes RLS policies for the `user_profiles` table

### Cloudflare account and Pages setup

1. Go to [Cloudflare](https://www.cloudflare.com/) and create an account
2. In the Cloudflare dashboard, go to "Workers & Pages"
3. Click "Create application" then "Pages" tab
4. Connect to your GitHub repository
5. Configure build settings:
   - Framework preset: Next.js (Static HTML Export)
   - Build command: `npm run build`
   - Build output directory: `out`
6. Set up environment variables (see [Environment variables](#environment-variables))
7. Deploy - Cloudflare will automatically redeploy when you push to the main branch

### LINE LIFF project

1. Create a LINE Developer account:

   - Go to [LINE Developers Console](https://developers.line.biz/console/)
   - Sign in with your LINE account or create one if needed
   - Create a new provider if you don't have one (click "Create" next to Providers)
   - Enter a provider name and click "Create"

2. Create a new channel:

   - At the selected provider, click "Create a new channel"
   - Choose "LINE Login"
   - Fill in required information and click "Create" at the end of the form

3. Set up LIFF app:
   - In your channel, go to the LIFF tab
   - Click "Add" to create a new LIFF app
   - Enter the following details:
     - LIFF app name: Your app name
     - Size: Full (or choose another size based on your needs)
     - Endpoint URL: `https://localhost:4416` (for local development)
     - Scopes: Check "profile" and "openid"
   - Click "Add"
   - Note your LIFF ID for later use in [environment variables](#environment-variables)

## Get started

Please follow the [Prerequisite](#prerequisite) first.

After you clone the project to your local machine, do the following:

### Environment variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# LINE LIFF Configuration
NEXT_PUBLIC_LINE_LIFF_ID=your_liff_id
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: You can find these in your Supabase project dashboard under Settings > API
- `NEXT_PUBLIC_LINE_LIFF_ID`: Access the LINE Developers Console, select your provider and channel, then locate the LIFF ID under Basic settings after adding the LIFF app to your channel

### Supabase setup

1. Install the Supabase CLI:

```bash
npm install -g @supabase/cli
```

2. Initialize Supabase and run locally:

```bash
# Start local Supabase instance
npm run supabase:start

# Apply database migrations
npm run supabase:migrate
```

3. Deploy Supabase Edge Functions:

```bash
# Bind supabase access token to your project
npm run supabase login
```

```bash
# Deploy the authenticate-line-user function
npm run supabase:functions:deploy
```

You'll need to set the LINE_CHANNEL_ID secret for the edge function:

```bash
supabase secrets set LINE_CHANNEL_ID=your_line_channel_id
```

### Run locally

1. Install dependencies

```bash
npm install
```

2. Start development servers

You can run both Next.js and Supabase together:

```bash
npm run dev:supabase
```

Or run them separately:

```bash
# Next.js app
npm run dev

# Supabase (in another terminal)
npm run supabase:start
```

- Frontend is running on `https://localhost:4416`
- Supabase local dashboard is running on `http://localhost:54323`

## Go Production

### Cloudflare Pages Environment Variables

In your Cloudflare Pages project settings, add the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `NEXT_PUBLIC_LINE_LIFF_ID`: Your LINE LIFF ID (create a separate one for production)

### LINE channel for production

Create a new LINE channel for production (follow the same [steps](#line-liff-project) as development).

Update the "Endpoint URL" in your LIFF app to your Cloudflare Pages domain (e.g., `https://your-project.pages.dev`).

### Supabase production setup

1. Deploy your Edge Functions to production:

```bash
supabase functions deploy --project-ref your_project_ref
```

2. Set production secrets:

```bash
supabase secrets set LINE_CHANNEL_ID=your_production_line_channel_id --project-ref your_project_ref
```

### Automatic deployment

Cloudflare Pages automatically deploys your site when you push to the main branch. No additional CI/CD configuration is needed.

## Project structure

The project follows a standard Next.js application structure with Supabase integration:

```
├── src/                      # Source code
│   ├── app/                  # Next.js App Router
│   │   ├── page.tsx          # Main dashboard page
│   │   ├── layout.tsx        # Root layout component
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── ui/               # UI components (shadcn/ui)
│   │   └── WelcomeDialog.tsx # User welcome dialog
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication context provider
│   ├── lib/                  # Utility libraries
│   │   ├── supabase.ts       # Supabase configuration and utilities
│   │   └── utils.ts          # General utility functions
│   ├── types/                # TypeScript type definitions
│   │   └── database.ts       # Database type definitions
│   └── server-types.d.ts     # TypeScript definitions for server types
├── supabase/                 # Supabase configuration
│   ├── functions/            # Supabase Edge Functions
│   │   └── authenticate-line-user/  # LINE authentication function
│   ├── migrations/           # Database migrations
│   │   └── 001_create_user_profiles.sql
│   └── config.toml          # Supabase local configuration
├── public/                   # Static assets
├── .env.local               # Local environment variables (git-ignored)
├── next.config.ts           # Next.js configuration
└── package.json             # Dependencies and scripts
```

### Key directories and files

- **src/app**: Contains the Next.js application using the App Router
- **src/components**: Reusable React components
- **src/contexts/AuthContext.tsx**: Manages authentication state and user data
- **src/lib/supabase.ts**: Supabase configuration and utility functions
- **supabase/functions**: Supabase Edge Functions for server-side logic
- **supabase/migrations**: Database schema and RLS policies
- **src/types/database.ts**: TypeScript definitions generated from Supabase

## Authentication flow

The authentication flow integrates LINE Login with Supabase Authentication:

1. **LIFF Initialization**: The app initializes the LINE LIFF SDK and checks if the user is already logged in.

2. **LINE Login**: When a user clicks the login button, they're redirected to LINE's login page. After successful login, they're redirected back with authentication tokens.

3. **Supabase Integration**: The app sends the LINE ID token to a Supabase Edge Function (`authenticate-line-user`), which verifies it and creates a user session. It also creates or updates the user's record in the `user_profiles` table.

4. **User Session**: The app signs in to Supabase using the session credentials and loads the user profile data from the database. Authentication state is maintained using React context.

5. **Logout Process**: When logging out, the app signs out from both Supabase and LINE, and the UI is updated to show the login button again.

## API

### `AuthProvider`

A React context provider that manages authentication state and user data.

```jsx
// Wrap your app with AuthProvider
import { AuthProvider } from '@/contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  )
}
```

### `useAuth`

A React hook that provides access to authentication state and functions.

```jsx
import { useAuth } from '@/contexts/AuthContext'

function YourComponent() {
  const {
    // Authentication status
    authStatus, // Current auth status: "idle" | "authenticating" | "fetchingProfile" | "error"
    isNewUser, // Whether the user is new (first login)
    shouldShowLogin, // Whether to show the login button

    // User data
    authUser, // Supabase Auth user object
    userProfile, // User profile data from database
    lineProfile, // LINE profile data

    // Authentication actions
    login, // Function to trigger LINE login
    logout, // Function to sign out from both Supabase and LINE
  } = useAuth()

  // Use these values and functions in your component
}
```

## Why I pick these tools

Fastest POC with minimal cost!

- **LINE Login** because it's a very popular chat app that most Thai people use. It has other powerful features when you scale the app.
- **Next.js** offers a simple config (just one flag) to generate static pages.
  - I prefer SSG over SSR because it's simpler for MVP which is more flexible to pick CDN and cost effective.
- **Cloudflare Pages** over Vercel because it's free for personal projects and automatically handles CI/CD with GitHub integration.
- **Supabase** over Firebase because:
  - More predictable pricing model
  - Built-in Row Level Security (RLS)
  - PostgreSQL database with better querying capabilities
  - Edge Functions are easier to develop and deploy
  - Better TypeScript support with auto-generated types
