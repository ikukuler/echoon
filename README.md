# EchoOn 📱

**Send messages to your future self** - A React Native mobile app with Node.js backend for delayed message delivery.

## 🚀 Features

- 📝 Create echoes (messages) with text, images, audio, video, and links
- 📅 Schedule delivery for any future date and time
- 🔔 Push notifications when echoes arrive
- 🔐 JWT-based email/password authentication
- 📱 Cross-platform mobile app (iOS/Android)
- 🐳 Docker containerization
- 📊 Queue management with BullMQ
- 🗄️ PostgreSQL database with Supabase

## 🏗️ Architecture

```
echoon/
├── backend/          # Node.js + Express API
├── mobile/           # React Native + Expo app
└── docs/            # Documentation
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **Supabase** (PostgreSQL)
- **Firebase Admin SDK** (Push notifications)
- **BullMQ** (Job queues)
- **Redis** (Queue backend)
- **JWT** (Authentication)
- **Docker** (Containerization)

### Mobile
- **React Native** + **Expo**
- **TypeScript**
- **Firebase** (Push notifications)
- **AsyncStorage** (Local storage)
- **NativeWind** (Styling)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Expo CLI
- Supabase account
- Firebase project

### 1. Clone Repository
```bash
git clone <repository-url>
cd echoon
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your credentials
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - FIREBASE_CREDENTIALS
# - REDIS_HOST/PORT

# Start with Docker
npm run docker:dev

# Or start locally
npm run dev
```

### 3. Mobile Setup
```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start
```

### 4. Database Setup
Run the SQL schema in your Supabase project:
```sql
-- See backend/database.sql
```

## 📱 Mobile App

### Screens
- **Login/Register** - Email/password authentication
- **Home** - List of user's echoes
- **Create Echo** - Create new delayed message

### Features
- 📅 Native date/time picker
- 📎 Multiple attachment types
- 🔔 Push notification support
- 🎨 Modern UI with animations

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Echoes
- `POST /api/echoes` - Create new echo
- `GET /api/user/echoes` - Get user's echoes
- `POST /api/user/tokens` - Register FCM token

### Health
- `GET /health` - Health check
- `GET /admin/queues` - Bull Board UI

## 🗄️ Database Schema

### Tables
- `users` - User accounts
- `echoes` - Delayed messages
- `echo_parts` - Message attachments
- `user_tokens` - FCM tokens for push notifications

## 🔔 Push Notifications

The app uses Firebase Cloud Messaging (FCM) to send push notifications when echoes are delivered:

1. **Token Registration** - Mobile app registers FCM token
2. **Job Scheduling** - Echo creation schedules BullMQ job
3. **Notification Delivery** - Job sends push to all user devices

## 🐳 Docker

### Development
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Services
- **Backend API** - Port 3000
- **Redis** - Port 6379
- **Redis Commander** - Port 8081

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:watch
npm run test:coverage
```

### Mobile Tests
```bash
cd mobile
npm test
```

## 📊 Monitoring

- **Bull Board UI** - Queue monitoring at `http://localhost:3000/admin/queues`
- **Health Check** - API health at `http://localhost:3000/health`
- **Redis Commander** - Redis management at `http://localhost:8081`

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FIREBASE_CREDENTIALS={"type":"service_account",...}
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

### Mobile (.env)
```env
API_BASE_URL=http://localhost:3000/api
FIREBASE_API_KEY=your_firebase_api_key
```

## 🚀 Deployment

### Backend
```bash
# Build Docker image
docker build -t echoon-backend .

# Run in production
docker run -p 3000:3000 --env-file .env echoon-backend
```

### Mobile
```bash
# Build for production
expo build:android
expo build:ios

# Or use EAS Build
eas build --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- 📧 Email: support@echoon.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: `/docs` directory

---

**Made with ❤️ for sending messages to your future self** 