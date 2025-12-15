# Liga Typerow - Next.js + Supabase

Modern football betting competition app built with Next.js 14 and Supabase.

## Features

- ⚽ **Match Betting** - Bet on football match scores
- 🔒 **Auto-lock** - Betting automatically closes when match starts
- 📊 **Live Leaderboard** - Real-time ranking updates
- 🌳 **KO Tree** - Predict the entire knockout stage bracket
- ⭐ **Best Scorer** - Bet on the tournament's top scorer
- 🔐 **Social Login** - Google & Facebook authentication
- 📱 **Mobile-first** - Responsive design for all devices
- 👨‍💼 **Admin Panel** - Manage matches, scores, and settings

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Lucide React

## Getting Started

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings > API

### 2. Set Up Database

1. Go to SQL Editor in your Supabase dashboard
2. Copy and run the contents of `supabase/schema.sql`
3. This creates all tables, RLS policies, and triggers

### 3. Configure Authentication

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable **Google**:
   - Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com)
   - Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as redirect URI
   - Copy Client ID and Secret to Supabase
3. Enable **Facebook**:
   - Create app at [Facebook Developers](https://developers.facebook.com)
   - Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as redirect URI
   - Copy App ID and Secret to Supabase

### 4. Install & Run

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
liga-typerow-next/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page
│   │   ├── login/             # Login page
│   │   ├── matches/           # Matches list
│   │   ├── ko-tree/           # Knockout tree betting
│   │   ├── ranking/           # Full leaderboard
│   │   └── auth/callback/     # OAuth callback handler
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Navbar, etc.
│   │   ├── matches/           # Match-related components
│   │   ├── leaderboard/       # Ranking components
│   │   ├── ko-tree/           # KO tree components
│   │   ├── ranking/           # Full ranking table
│   │   └── providers/         # Context providers
│   ├── types/
│   │   └── database.ts        # Supabase types
│   └── utils/
│       ├── cn.ts              # className utility
│       └── supabase/          # Supabase clients
├── supabase/
│   └── schema.sql             # Database schema
└── package.json
```

## Database Schema

| Table | Description |
|-------|-------------|
| `teams` | Football teams with flags |
| `players` | Players for best scorer betting |
| `profiles` | User profiles (extends auth.users) |
| `matches` | Match schedule and results |
| `bets` | User match predictions |
| `scorer_bets` | Best scorer predictions |
| `ko_trees` | Knockout stage bracket structure |
| `ko_bets` | User knockout predictions |
| `rankings` | Aggregated user points |
| `settings` | Admin-configurable values |

## Points System

Default configuration (adjustable in `settings` table):

| Action | Points |
|--------|--------|
| Exact score | 5 |
| Correct winner/draw | 2 |
| Per goal by chosen scorer | 1 |
| KO stage correct prediction | varies |

## Admin Setup

1. After first login, update your profile in Supabase:
   ```sql
   UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';
   ```

2. Admins can:
   - Add/edit teams and players
   - Create matches
   - Enter match results (triggers automatic point calculation)
   - Modify settings

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Other Platforms

```bash
npm run build
npm start
```

## Migration from Django

This project is designed to replace the Django-based Liga Typerow. Key differences:

| Django | Next.js + Supabase |
|--------|-------------------|
| Server-rendered templates | React components |
| Django ORM | Supabase (PostgreSQL) |
| django-allauth | Supabase Auth |
| Manual point calculation | Database triggers |
| Gunicorn/Nginx | Serverless (Vercel) |

To migrate data:
1. Export from Django PostgreSQL
2. Transform to match new schema
3. Import to Supabase

## License

MIT
