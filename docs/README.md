# 💰 BudgetBot - Smart Personal Finance Management

<div align="center">

![BudgetBot](https://img.shields.io/badge/BudgetBot-Financial%20Freedom-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)

**Transform your financial habits with AI-powered insights and real-time expense tracking**

[Live Demo](https://your-app.vercel.app) • [Report Bug](https://github.com/LOHITH5506H/Budget-bot/issues) • [Request Feature](https://github.com/LOHITH5506H/Budget-bot/issues)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technologies Used](#-technologies-used)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [API Integrations](#-api-integrations)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**BudgetBot** is a modern, AI-powered personal finance management application that helps users track expenses, manage subscriptions, set savings goals, and receive intelligent financial insights. Built with Next.js 14 and powered by cutting-edge technologies, BudgetBot makes financial management effortless and engaging.

### Why BudgetBot?

- 🤖 **AI-Powered Insights**: Get personalized financial advice powered by Google Gemini AI
- 📊 **Real-Time Analytics**: Track spending patterns with interactive charts and visualizations
- 🔔 **Smart Notifications**: Never miss a subscription payment with Pusher-powered real-time alerts
- 📈 **Gamification**: Build financial discipline with streak tracking and achievement systems
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and Radix UI
- 🔒 **Secure**: Enterprise-grade security with Supabase authentication and RLS policies

---

## ✨ Key Features

### 💳 Expense Management
- **Quick Expense Entry**: Add expenses in seconds with smart categorization
- **Category Tracking**: Organize expenses into customizable categories
- **Need vs Want Analysis**: Understand spending priorities with visual breakdowns
- **Monthly Overview**: Interactive charts showing spending patterns
- **Expense History**: Complete transaction history with search and filters

### 💰 Income Tracking
- **Multiple Income Sources**: Track salary, freelance, business, investments, and more
- **Recurring Income**: Set up weekly, biweekly, monthly, or yearly recurring income
- **8 Income Categories**: Salary, Freelance, Business, Investment, Bonus, Rental, Gift, Other
- **Monthly Totals**: Real-time income summaries and trends

### 📊 Financial Summary
- **Income vs Expenses**: Visual comparison of earnings and spending
- **Net Balance**: Real-time calculation of monthly surplus/deficit
- **Spending Rate**: Dynamic progress bar showing expense percentage
- **Savings Rate**: Track how much you're saving each month
- **Financial Health Indicators**: Color-coded alerts for spending patterns

### 🔄 Subscription Management
- **Subscription Tracking**: Monitor all recurring subscriptions in one place
- **Auto Logo Fetching**: Automatically fetch company logos from domains
- **Billing Cycle Support**: Monthly, yearly, weekly, biweekly tracking
- **Upcoming Payments**: Dashboard widget showing next due subscriptions
- **Cost Analysis**: Calculate total subscription costs over time

### 🎯 Savings Goals
- **Goal Setting**: Create and track multiple savings goals
- **Progress Visualization**: Beautiful progress bars and percentage tracking
- **Target Dates**: Set deadlines for achieving financial goals
- **Goal Categories**: Home, Car, Emergency Fund, Vacation, Education, and more
- **Achievement Tracking**: Celebrate milestones as you reach your goals

### 🤖 AI-Powered Insights
- **Personalized Advice**: Get tailored financial recommendations
- **Spending Analysis**: AI analyzes your spending patterns
- **Savings Suggestions**: Smart tips to improve your savings rate
- **Budget Optimization**: Recommendations for better financial health
- **Real-Time Updates**: Insights refresh as you add transactions

### 🔥 Streak System
- **Daily Engagement**: Track consecutive days of expense logging
- **Habit Building**: Gamify financial discipline
- **Visual Feedback**: Fire emoji indicators for active streaks
- **Motivation**: Encouragement to maintain consistent tracking

### 📧 Weekly Reports
- **Automated Emails**: Get weekly financial summaries via SendPulse
- **PDF/CSV Reports**: Download detailed expense reports
- **Spending Breakdowns**: Category-wise analysis
- **Trend Analysis**: Week-over-week comparisons
- **Cron Scheduling**: Automated report generation via Vercel Cron

### 📅 Calendar Integration
- **Google Calendar Sync**: Add subscriptions to your calendar
- **Payment Reminders**: Never miss a due date
- **OAuth 2.0**: Secure calendar access
- **Event Management**: Automatic event creation and updates

### 🔔 Real-Time Notifications
- **Pusher Integration**: Instant notifications across devices
- **Toast Alerts**: Beautiful in-app notifications
- **Event Broadcasting**: Real-time updates for expenses, income, goals
- **Cross-Tab Sync**: Changes reflect immediately across all browser tabs

### 🎨 User Experience
- **Dark/Light Mode**: Adaptive theming with next-themes
- **Responsive Design**: Perfect on mobile, tablet, and desktop
- **Loading States**: Smooth transitions with NextJS TopLoader
- **Form Validation**: Real-time validation with React Hook Form + Zod
- **Accessibility**: WCAG 2.1 compliant with Radix UI primitives

### 🔐 Security
- **Strong Password Requirements**: 8+ characters, uppercase, lowercase, number, special character
- **Row Level Security**: Supabase RLS policies protect user data
- **OAuth Support**: Google Sign-In integration
- **Session Management**: Secure authentication with Supabase Auth
- **Environment Protection**: Sensitive data in environment variables

---

## 🛠 Technologies Used

### Frontend
- **[Next.js 14.2.16](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Recharts](https://recharts.org/)** - Chart and visualization library
- **[React Hook Form](https://react-hook-form.com/)** - Form state management
- **[Zod](https://zod.dev/)** - Schema validation

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database and authentication
- **[Supabase Auth](https://supabase.com/auth)** - User authentication
- **[Supabase Realtime](https://supabase.com/realtime)** - Real-time subscriptions
- **[Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)** - Data security

### APIs & Integrations
- **[Google Gemini AI](https://ai.google.dev/)** - AI-powered financial insights
  - Model: `gemini-2.0-flash-lite`
  - Smart expense analysis and personalized recommendations
  
- **[Pusher](https://pusher.com/)** - Real-time notifications
  - Channel-based messaging
  - Private user channels
  - Cross-device synchronization
  
- **[Google Calendar API](https://developers.google.com/calendar)** - Calendar integration
  - OAuth 2.0 authentication
  - Event creation and management
  
- **[SendPulse](https://sendpulse.com/)** - Email automation
  - Weekly financial reports
  - Automated email campaigns
  
- **[Clearbit Logo API](https://clearbit.com/logo)** - Company logo fetching
  - Automatic subscription logo retrieval

### DevOps & Deployment
- **[Vercel](https://vercel.com/)** - Hosting and deployment
- **[Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)** - Scheduled tasks
- **[GitHub](https://github.com/)** - Version control
- **[pnpm](https://pnpm.io/)** - Package manager

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[PostCSS](https://postcss.org/)** - CSS processing
- **[Autoprefixer](https://github.com/postcss/autoprefixer)** - CSS vendor prefixes

---

## 🏗 Architecture

### Application Structure

```
BudgetBot (Next.js App Router)
│
├── Frontend Layer
│   ├── App Router Pages (/app)
│   ├── React Components (/components)
│   ├── UI Components (/components/ui)
│   └── Custom Hooks (/hooks)
│
├── Backend Layer
│   ├── API Routes (/app/api)
│   ├── Server Actions
│   └── Middleware
│
├── Data Layer
│   ├── Supabase Client
│   ├── Database Schema
│   └── RLS Policies
│
└── External Services
    ├── Gemini AI API
    ├── Pusher Realtime
    ├── Google Calendar
    └── SendPulse Email
```

### Data Flow

1. **User Action** → React Component
2. **Component** → API Route (Server-side)
3. **API Route** → Supabase Database
4. **Database** → RLS Policy Check → Response
5. **Real-time Updates** → Pusher → All Connected Clients
6. **AI Analysis** → Gemini API → Insights Widget

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Supabase account
- Google Cloud Platform account (for Gemini AI and Calendar)
- Pusher account
- SendPulse account (optional, for email reports)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/LOHITH5506H/Budget-bot.git
cd Budget-bot
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Configure environment variables** (see [Environment Variables](#-environment-variables))

5. **Run database migrations** (see [Database Setup](#-database-setup))

6. **Start development server**
```bash
pnpm dev
```

7. **Open browser**
```
http://localhost:3000
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Supabase Configuration
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Google Services
```env
# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Google Calendar API
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

### Pusher Real-time
```env
# Pusher
NEXT_PUBLIC_PUSHER_APP_KEY=your-pusher-key
PUSHER_APP_ID=your-app-id
PUSHER_SECRET=your-pusher-secret
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
```

### SendPulse Email (Optional)
```env
# SendPulse
SENDPULSE_API_USER_ID=your-user-id
SENDPULSE_API_SECRET=your-secret
SENDPULSE_FROM_EMAIL=noreply@yourdomain.com
SENDPULSE_FROM_NAME=BudgetBot
```

### Application Settings
```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🗄 Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Copy your project URL and API keys

### 2. Run SQL Migrations

Execute the following SQL scripts in order from the `/scripts` folder in Supabase SQL Editor:

```sql
-- 1. Base schema
scripts/001_create_database_schema.sql

-- 2. Subscriptions table
scripts/002_add_subscriptions_table.sql

-- 3. Add descriptions to goals
scripts/003_add_description_to_savings_goals.sql

-- 4. Billing cycle support
scripts/004_add_billing_cycle_to_subscriptions.sql

-- 5. Fix categories access
scripts/005_fix_categories_access.sql

-- 6. Add company domains
scripts/006_add_company_domain_to_subscriptions.sql

-- 7. Streak system
scripts/007_add_streak_update_trigger.sql

-- 8. Goal savings entries
scripts/008_add_goal_savings_entries.sql

-- 9. Income tracking
scripts/009_add_income_table.sql
```

### 3. Enable Row Level Security

All tables have RLS enabled by default. Users can only access their own data.

### 4. Database Schema

**Main Tables:**
- `profiles` - User profile information
- `categories` - Expense categories
- `expenses` - Expense transactions
- `income` - Income transactions
- `subscriptions` - Recurring subscriptions
- `savings_goals` - Savings goals
- `goal_savings_entries` - Goal contribution history

---

## 🔌 API Integrations

### Google Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local` as `GEMINI_API_KEY`

**Usage in BudgetBot:**
- Analyzes spending patterns
- Provides personalized financial advice
- Suggests budget optimizations
- Calculates savings rate insights

### Pusher Setup

1. Create account at [Pusher](https://pusher.com/)
2. Create a new Channels app
3. Copy credentials to `.env.local`

**Channels Used:**
- `private-user-{userId}` - User-specific notifications
- Events: `expense-updated`, `income-updated`, `subscription-updated`, `goal-updated`

### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/calendar/callback`
   - `https://your-domain.vercel.app/api/calendar/callback`

### SendPulse Setup (Optional)

1. Create account at [SendPulse](https://sendpulse.com/)
2. Get API credentials from Settings → API
3. Add to `.env.local`

**Used for:**
- Weekly expense reports via email
- Subscription renewal reminders
- Goal achievement notifications

---

## 📦 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Environment Variables**
   - Add all environment variables from `.env.local`
   - Use production URLs for callback URIs

4. **Deploy**
   - Vercel will automatically deploy on push to main branch

### Vercel Cron Jobs

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/schedule",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Runs daily at 9:00 AM UTC for notification scheduling.

---

## 📂 Project Structure

```
Budget-bot/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── ai-insights/          # Gemini AI integration
│   │   ├── calendar/             # Google Calendar sync
│   │   ├── notifications/        # Notification scheduling
│   │   ├── pusher/               # Pusher auth & triggers
│   │   └── reports/              # Report generation
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   └── sign-up/
│   ├── dashboard/                # Main dashboard
│   ├── goals/                    # Savings goals page
│   ├── settings/                 # User settings
│   ├── subscriptions/            # Subscriptions page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # React Components
│   ├── dashboard/                # Dashboard widgets
│   │   ├── ai-nudges-widget.tsx
│   │   ├── income-expense-summary.tsx
│   │   ├── quick-expense-widget.tsx
│   │   ├── quick-income-widget.tsx
│   │   ├── spending-overview-widget.tsx
│   │   └── streak-widget.tsx
│   ├── goals/                    # Goal components
│   ├── subscriptions/            # Subscription components
│   ├── ui/                       # Radix UI components
│   └── global-pusher-provider.tsx
│
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── google-calendar.ts
│   ├── pusher-service.ts
│   ├── sendpulse.tsx
│   └── utils.ts
│
├── hooks/                        # Custom React hooks
│   ├── use-loading-navigation.ts
│   ├── use-pusher.ts
│   └── use-toast.ts
│
├── contexts/                     # React contexts
│   └── loading-context.tsx
│
├── scripts/                      # Database migrations
│   ├── 001_create_database_schema.sql
│   ├── 002_add_subscriptions_table.sql
│   └── ...
│
├── public/                       # Static assets
├── styles/                       # Global styles
├── .env.local                    # Environment variables (not in repo)
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

---

## 🎨 UI Components

Built with **Radix UI** and **Tailwind CSS** for accessibility and customization:

- `<Button />` - Multiple variants (default, destructive, outline, ghost)
- `<Card />` - Container with header, content, footer sections
- `<Dialog />` - Modal dialogs for forms
- `<Select />` - Accessible dropdowns
- `<Input />` - Text inputs with validation
- `<Toast />` - Notification toasts
- `<Progress />` - Progress bars for goals
- `<Tabs />` - Tabbed interfaces
- `<Avatar />` - User avatars
- `<Badge />` - Status indicators

---

## 📊 Key Features Breakdown

### Dashboard Widgets

1. **Streak Widget** - Daily expense logging streak with fire emoji
2. **Quick Expense Entry** - Add expenses in 2 seconds
3. **Quick Income Entry** - Track income sources
4. **Income vs Expense Summary** - Real-time financial overview
5. **Spending Overview** - Pie chart and bar chart visualizations
6. **Savings Goals** - Progress tracking with visual indicators
7. **Upcoming Subscriptions** - Next billing dates
8. **AI Insights** - Personalized financial advice
9. **Weekly Report** - Download expense reports

### Real-Time Features

- Instant updates across devices via Pusher
- Live expense total updates
- Real-time goal progress changes
- Subscription updates broadcast
- AI insights auto-refresh on data changes

### Smart Algorithms

- **Savings Rate Calculation**: `(income - expenses) / income * 100`
- **Spending Rate**: `expenses / income * 100`
- **Streak Tracking**: Consecutive days with at least 1 expense
- **Need vs Want Ratio**: Categorizes spending priorities

---

## 🔐 Security Features

- ✅ Row Level Security (RLS) on all database tables
- ✅ Strong password requirements (8+ chars, mixed case, numbers, symbols)
- ✅ OAuth 2.0 for Google integrations
- ✅ Environment variable protection
- ✅ HTTPS enforcement in production
- ✅ Secure session management
- ✅ XSS and CSRF protection
- ✅ Input validation with Zod schemas

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for type safety
- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**LOHITH5506H**
- GitHub: [@LOHITH5506H](https://github.com/LOHITH5506H)
- Project: [Budget-bot](https://github.com/LOHITH5506H/Budget-bot)

---

## 🙏 Acknowledgments

- [Next.js Team](https://nextjs.org/) for the amazing framework
- [Vercel](https://vercel.com/) for hosting and deployment
- [Supabase](https://supabase.com/) for backend infrastructure
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [Google](https://ai.google.dev/) for Gemini AI
- [Pusher](https://pusher.com/) for real-time capabilities

---

## 📞 Support

If you have any questions or need help:

- 📧 Email: support@budgetbot.com
- 🐛 Issues: [GitHub Issues](https://github.com/LOHITH5506H/Budget-bot/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/LOHITH5506H/Budget-bot/discussions)

---

<div align="center">

**Made with ❤️ by LOHITH5506H**

⭐ Star this repo if you find it helpful!

[⬆ Back to Top](#-budgetbot---smart-personal-finance-management)

</div>
