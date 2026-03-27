# Orange Tierlist - Project Plan

## Current Status
✅ Backend complete and tested
- PostgreSQL database on Railway
- Express server with REST API + WebSockets
- All CRUD endpoints working
- Migration successful

🚧 Next: Build frontend pages

## Tech Stack
- **Backend**: Node.js + Express + Socket.io
- **Database**: PostgreSQL (Railway)
- **Frontend**: Vanilla JS + Canvas for tierlist rendering
- **Hosting**: Railway ($5/month)
- **Real-time**: WebSockets via Socket.io

## Database Schema

### `oranges` table
- id (serial primary key)
- name (varchar 255)
- description (text)
- image_url (varchar 255)
- created_at (timestamp)

### `votes` table
- id (serial primary key)
- orange_id (foreign key → oranges.id, cascade delete)
- username (varchar 100)
- tier (char 1: S/A/B/C/D/F)
- created_at (timestamp)
- UNIQUE constraint on (orange_id, username)

## API Endpoints

### Public
- `GET /` - Redirect to tierlist
- `GET /api/oranges` - List all oranges
- `GET /api/oranges/:id` - Get orange with vote stats
- `GET /api/votes` - Get all votes
- `GET /api/tierlist` - Get oranges with calculated tiers
- `POST /api/vote` - Submit vote (auth required)

### Admin (auth required)
- `POST /api/admin/oranges` - Create orange
- `PUT /api/admin/oranges/:id` - Update orange
- `DELETE /api/admin/oranges/:id` - Delete orange

### WebSocket Events
- `voteUpdate` - Broadcast when vote submitted
- `orangeCreated` - Broadcast when orange created
- `orangeUpdated` - Broadcast when orange updated
- `orangeDeleted` - Broadcast when orange deleted

## Frontend Pages to Build

### 1. Admin Panel (`/admin.html`) - IN PROGRESS
**Features:**
- Password-protected access
- Form to add new orange (name, description, image URL)
- List of existing oranges
- Edit/delete buttons for each orange
- Real-time updates when oranges change

**Layout:**
```
┌─────────────────────────────┐
│  ORANGE ADMIN PANEL         │
├─────────────────────────────┤
│  Login: [password] [submit] │
├─────────────────────────────┤
│  Add New Orange:            │
│  Name: [_____________]      │
│  Description: [________]    │
│  Image URL: [__________]    │
│  [Add Orange]               │
├─────────────────────────────┤
│  Existing Oranges:          │
│  • Navel Orange             │
│    [Edit] [Delete]          │
│  • Blood Orange             │
│    [Edit] [Delete]          │
└─────────────────────────────┘
```

### 2. Tierlist Display (`/tierlist.html`)
**Features:**
- Canvas-based rendering
- 6 horizontal tiers (S, A, B, C, D, F)
- Orange images arranged in tiers based on votes
- Real-time updates via WebSocket
- Hamburger menu for navigation

**Tier Calculation:**
- Mode (most common vote)
- Ties broken by higher tier (S > A > B > C > D > F)

### 3. Voting Page (`/vote.html`)
**Features:**
- URL: `/vote.html?orange=ID`
- Display orange image, name, description
- 6 tier buttons (S, A, B, C, D, F)
- Click to vote instantly
- Cookie-based auth
- Hamburger menu to switch oranges
- Show confirmation after vote

### 4. Shared Components
- Hamburger menu (all pages)
- Styles (CSS)

## Implementation Order
1. ✅ Backend setup (server.js, db.js)
2. ✅ Database migration
3. ✅ Test API endpoints
4. 🚧 Admin panel (current)
5. Tierlist display
6. Voting page
7. Shared styles & menu
8. Railway deployment config
9. Domain setup

## Environment Variables
```
DATABASE_URL or DATABASE_PUBLIC_URL - PostgreSQL connection
MASTER_PASSWORD - Auth password (default: "orange")
PORT - Server port (default: 3000)
NODE_ENV - Environment (development/production)
```

## Deployment Steps (Later)
1. Push to GitHub
2. Create Railway project (already done for DB)
3. Add web service connected to GitHub repo
4. Set environment variables
5. Deploy (migrations run automatically)
6. Configure custom domain
7. Update DNS records

## Testing Checklist
- [x] Database connection
- [x] Create orange API
- [x] List oranges API
- [ ] Admin panel UI
- [ ] Tierlist display
- [ ] Voting flow
- [ ] Real-time updates
- [ ] Mobile responsive
- [ ] Production deployment

## Resume Value
- Full-stack CRUD application
- WebSockets for real-time updates
- PostgreSQL database
- REST API design
- Railway deployment
- Custom domain setup
