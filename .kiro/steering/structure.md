# Project Structure

## Root Level
```
city-collect/
├── packages/           # Monorepo packages
├── package.json        # Root package with dev script
├── node_modules/       # Shared dependencies
├── .gitignore         # Git ignore rules
└── .kiro/             # Kiro configuration and steering
```

## Backend Structure (`packages/backend/`)
```
backend/
├── models/
│   └── daren.js       # Mongoose schema for influencer data
├── routes/
│   └── daren.js       # API routes for CRUD operations and scraping
├── server.js          # Main Fastify server setup
├── package.json       # Backend dependencies
└── node_modules/      # Backend-specific dependencies
```

### Key Backend Files
- **server.js**: Main application entry point, MongoDB connection, route registration
- **models/daren.js**: Comprehensive influencer data model with 25+ fields
- **routes/daren.js**: RESTful API endpoints plus specialized scraping endpoints

## Frontend Structure (`packages/frontend/`)
```
frontend/
├── src/
│   ├── components/
│   │   └── DarenManager.vue    # Main management interface
│   ├── assets/                 # Static assets
│   ├── App.vue                # Root component
│   ├── main.ts                # Application entry point
│   └── style.css              # Global styles
├── public/                    # Public assets
├── package.json              # Frontend dependencies
├── vite.config.ts           # Vite configuration
└── tsconfig.json            # TypeScript configuration
```

### Key Frontend Files
- **DarenManager.vue**: Single-page application managing all influencer operations
- **main.ts**: Vue 3 app initialization with Element Plus integration

## Data Model Structure
The Daren (influencer) model includes grouped fields:

### Basic Information
- nickname, platform, period, fee, followers, xiaohongshuId, ipLocation

### Contact & Progress Tracking  
- contactPerson, contactInfo, hasConnection, inGroup, storeArrivalTime, arrivedAtStore, reviewed, published

### Platform Links
- homePage (Xiaohongshu), douyinLink, dianping, mainPublishLink, syncPublishLink

### Analytics & Metrics
- exposure, reads, likes, comments, collections, forwards

### Administrative
- cooperationMethod, remarks, timestamps

## API Endpoints
- `GET /api/darens` - List influencers (with period filtering)
- `GET /api/darens/:id` - Get single influencer
- `POST /api/darens` - Create new influencer
- `PUT /api/darens/:id` - Update influencer
- `DELETE /api/darens/:id` - Delete influencer
- `GET /api/periods` - Get distinct campaign periods
- `POST /api/parse-xhs-page` - Parse Xiaohongshu profile page
- `POST /api/parse-xhs-note` - Parse Xiaohongshu note/post page

## Development Patterns
- **Component Architecture**: Single large component with inline editing capabilities
- **State Management**: Vue 3 Composition API with reactive refs
- **Form Handling**: Element Plus forms with validation rules
- **Data Fetching**: Axios with async/await pattern
- **Error Handling**: Centralized error messages via Element Plus notifications