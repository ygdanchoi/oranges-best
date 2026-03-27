# Orange Tierlist

A live tier voting application where users vote on oranges using an S/A/B/C/D/F tier system. Features real-time updates via WebSockets, a beautiful tierlist display, and a mobile-optimized voting interface.

## Features

- **Live Tierlist Display** - Beautiful gradient design with color-coded tiers
- **Real-time Updates** - WebSocket integration shows votes instantly across all clients
- **Mobile-Optimized Voting** - Clean, touch-friendly tier buttons
- **Admin Panel** - Full CRUD interface for managing oranges
- **Hamburger Menu** - Easy navigation between oranges
- **Cookie-based Auth** - Login persistence across sessions
- **PostgreSQL Database** - Reliable vote storage with proper indexing
- **Security by Obscurity** - Hidden admin panel URL

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL (Railway)
- **Frontend**: Vanilla JavaScript, Canvas (for future enhancements)
- **Hosting**: Railway
- **Real-time**: WebSockets via Socket.io

## Project Structure

```
├── server.js              # Express + Socket.io server
├── db.js                  # PostgreSQL connection and queries
├── package.json           # Dependencies
├── start.sh               # Railway startup script
├── railway.json           # Railway deployment config
├── migrations/
│   ├── init.sql           # Initial database schema
│   └── add_store_field.sql # Store field migration
├── public/
│   ├── tierlist.html      # Main tierlist display
│   ├── tierlist.js        # Tierlist logic + WebSocket
│   ├── vote.html          # Voting interface
│   ├── vote.js            # Voting logic
│   ├── admin.html         # Admin CRUD panel
│   ├── admin.js           # Admin operations
│   ├── menu.js            # Shared hamburger menu
│   └── styles.css         # Shared styles
└── data/                  # (Optional) Seed data
```

## Local Development

### Prerequisites
- Node.js 16+
- Railway account (for database)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd oranges-best
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file:
   ```env
   DATABASE_PUBLIC_URL=postgresql://...  # From Railway PostgreSQL
   MASTER_PASSWORD=orange
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Visit the app**
   - Tierlist: http://localhost:3000
   - Vote: http://localhost:3000/vote.html?orange=ID
   - Admin: http://localhost:3000/admin.html

## Database Schema

### `oranges` table
- `id` - Serial primary key
- `name` - VARCHAR(255), orange name
- `description` - TEXT, description
- `image_url` - VARCHAR(255), image URL
- `store` - VARCHAR(100), where purchased
- `created_at` - Timestamp

### `votes` table
- `id` - Serial primary key
- `orange_id` - Foreign key to oranges (cascade delete)
- `username` - VARCHAR(100), voter username
- `tier` - CHAR(1), S/A/B/C/D/F
- `created_at` - Timestamp
- UNIQUE constraint on (orange_id, username)

## API Endpoints

### Public
- `GET /` - Redirect to tierlist
- `GET /api/oranges` - List all oranges
- `GET /api/oranges/:id` - Get single orange with vote stats
- `GET /api/votes` - Get all votes
- `GET /api/tierlist` - Get oranges with calculated tiers
- `POST /api/vote` - Submit vote (auth required)

### Admin (auth required)
- `POST /api/admin/oranges` - Create orange
- `PUT /api/admin/oranges/:id` - Update orange
- `DELETE /api/admin/oranges/:id` - Delete orange

### WebSocket Events
- `voteUpdate` - Emitted when vote submitted
- `orangeCreated` - Emitted when orange created
- `orangeUpdated` - Emitted when orange updated
- `orangeDeleted` - Emitted when orange deleted

## Deployment to Railway

### Initial Setup

1. **Create Railway Project**
   - Go to https://railway.app
   - Create new project
   - Add PostgreSQL service (already done)

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

3. **Connect Railway to GitHub**
   - In Railway, create new service
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Node.js and use `railway.json` config

4. **Set Environment Variables in Railway**
   - `DATABASE_URL` - Auto-set by Railway PostgreSQL
   - `MASTER_PASSWORD` - Set your admin password
   - `NODE_ENV` - Set to `production`

5. **Deploy**
   - Railway will automatically build and deploy
   - Migrations are already run (database is set up)

### Custom Domain Setup

1. **In Railway Dashboard**
   - Go to your web service
   - Click "Settings" → "Domains"
   - Click "Custom Domain"
   - Enter your domain (e.g., oranges.yourdomain.com)

2. **Update DNS Records**
   - Go to your domain registrar
   - Add CNAME record:
     - Name: `oranges` (or `@` for root domain)
     - Value: `<your-railway-subdomain>.railway.app`
   - Wait for DNS propagation (5-30 minutes)

3. **SSL Certificate**
   - Railway automatically provisions SSL via Let's Encrypt
   - Your site will be available at `https://yourdomain.com`

## Usage

### Admin Panel
1. Visit `/admin.html`
2. Login with password (default: `orange`)
3. Add/edit/delete oranges
4. Copy vote URLs for each orange

### Voting
1. Share vote URLs: `/vote.html?orange=ID`
2. Users login with any username + master password
3. Click tier button (S/A/B/C/D/F) to vote
4. Votes update automatically via WebSocket

### Tierlist
1. Visit root URL or `/tierlist.html`
2. See oranges organized by tier
3. Click any orange to vote on it
4. Updates in real-time as votes come in

## Tier Calculation

Uses **mode** (most common vote):
- Tallies all votes for each orange
- Assigns tier with most votes
- Ties broken by higher tier (S > A > B > C > D > F)
- Oranges with no votes show `null` tier (not displayed)

## Security Notes

- Admin panel URL is hidden (security by obscurity)
- Single master password for all users (fine for trusted groups)
- Votes are public and associated with usernames
- No rate limiting (add if needed for public deployment)
- Cookie-based auth (30-day expiration)

## Future Enhancements

- [ ] Image upload for oranges (currently URL-based)
- [ ] User profiles and voting history
- [ ] Export results to CSV/JSON
- [ ] Analytics dashboard (vote trends, popular oranges)
- [ ] QR code generation for vote URLs
- [ ] Rate limiting on voting
- [ ] OAuth/social login

## License

MIT

## Resume Value

This project demonstrates:
- Full-stack web development (Node.js + vanilla JS)
- Real-time features (WebSockets)
- Database design and optimization (PostgreSQL)
- RESTful API design
- Cloud deployment (Railway)
- Responsive UI design
- CRUD operations
- Authentication and session management
