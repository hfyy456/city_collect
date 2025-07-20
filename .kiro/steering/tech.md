# Technology Stack

## Architecture
- **Monorepo Structure**: Uses a packages-based monorepo with separate backend and frontend
- **Full-Stack JavaScript/TypeScript**: Node.js backend with Vue.js frontend

## Backend Stack
- **Runtime**: Node.js
- **Framework**: Fastify (high-performance web framework)
- **Database**: MongoDB with Mongoose ODM
- **Web Scraping**: 
  - Cheerio for HTML parsing
  - Puppeteer for dynamic content scraping
  - Axios for HTTP requests
- **CORS**: @fastify/cors for cross-origin requests

## Frontend Stack
- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **UI Library**: Element Plus
- **Build Tool**: Vite
- **HTTP Client**: Axios

## Development Tools
- **Package Manager**: npm/yarn (both lock files present)
- **Process Manager**: Concurrently for running both services
- **TypeScript**: Full TypeScript support in frontend

## Common Commands

### Development
```bash
# Start both backend and frontend in development mode
npm run dev

# Start backend only
npm run start --prefix packages/backend

# Start frontend only  
npm run dev --prefix packages/frontend
```

### Backend Commands
```bash
cd packages/backend
npm start          # Start production server
```

### Frontend Commands
```bash
cd packages/frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Configuration Notes
- Backend runs on port 3000
- MongoDB connection string configured in server.js
- CORS configured to allow all origins (should be restricted in production)
- Cookie-based authentication for Xiaohongshu scraping
- Puppeteer configured to use Microsoft Edge executable