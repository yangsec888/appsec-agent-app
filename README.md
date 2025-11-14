# AppSec Agent App

Application built on top of the `appsec-agent` library for Application Security automation.

## 🚀 Quick Start

### 1. Setup

The project is already configured to use the local `appsec-agent` package. If you need to set it up fresh:

```bash
# Install dependencies (uses local appsec-agent)
npm install

# Build the appsec-agent library first (if not already built)
cd ../appsec-agent && npm run build && cd ../appsec-agent-app
```

### 2. Environment Variables

#### Backend Configuration

Create `backend/.env` file:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your API key:
```env
PORT=3001
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_BASE_URL=https://api.anthropic.com
JWT_SECRET=your-secret-key-change-in-production
```

#### Frontend Configuration

Create `frontend/.env.local` file:
```bash
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local` and add your API key:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ANTHROPIC_API_KEY=your-api-key-here
NEXT_PUBLIC_ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### 3. Build and Run

```bash
# Build the project
npm run build

# Run the application
npm start

# Or run in development mode (no build needed)
npm run dev
```

### 4. Web Dashboard Setup

For the full web dashboard with authentication, see [SETUP.md](./SETUP.md) for detailed instructions.

## ✨ Features

### Web Dashboard
- **Code Review** - Run security code reviews on repositories
- **Threat Modeling** - Perform threat modeling analysis  
- **Chat Interface** - Query the agent through a chat interface

### Authentication System
- **User Registration & Login** - Secure user account management
- **JWT Authentication** - Token-based session management
- **Password Security** - Bcrypt password hashing
- **Default Admin User** - Pre-configured admin account (username: `admin`, password: `admin`)
- **Password Change Reminder** - Security reminder for users with default passwords
- **Protected Routes** - All API endpoints require authentication

### Database
- **SQLite Database** - Local user storage (no external database required)
- **Automatic Migration** - Database schema updates automatically

## 📁 Project Structure

```
appsec-agent-app/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── db/          # Database setup and models
│   │   ├── models/      # User model
│   │   ├── routes/      # API routes (auth, code-review, etc.)
│   │   ├── middleware/  # Authentication middleware
│   │   └── init/        # Initialization scripts
│   ├── data/            # SQLite database (created automatically)
│   └── package.json
├── frontend/            # Next.js React application
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── contexts/        # React contexts (AuthContext)
│   ├── lib/             # API client and utilities
│   └── package.json
├── src/
│   └── index.ts         # Main entry point (example code)
├── dist/                # Compiled JavaScript (after build)
├── package.json         # Root package.json
├── tsconfig.json        # TypeScript configuration
├── README.md            # This file
└── SETUP.md             # Web Dashboard setup guide
```

## 💡 Next Steps

1. **Customize `src/index.ts`** - Modify the example code for your use case
2. **Build your app** - Start implementing your AppSec automation workflow
3. **See [SETUP.md](./SETUP.md)** - Detailed setup and configuration guide

## 🔧 Using appsec-agent from npm (when published)

Once `appsec-agent` is published to npm, you can switch to using it from the registry:

1. Update `package.json`:
   ```json
   "dependencies": {
     "appsec-agent": "^0.0.1"
   }
   ```

2. Reinstall:
   ```bash
   npm install
   ```

## 📖 Documentation

- [appsec-agent README](../appsec-agent/README.md)
- [SETUP.md](./SETUP.md) - Web Dashboard setup and configuration guide
- [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk)

