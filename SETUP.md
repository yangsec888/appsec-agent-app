# AppSec Agent Dashboard - Setup Guide

This guide will help you set up the Web Dashboard (Idea #1) with Next.js frontend and Express.js backend.

## 🏗️ Project Structure

```
appsec-agent-app/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── index.ts
│   │   └── routes/
│   └── package.json
├── frontend/         # Next.js React application
│   ├── app/
│   ├── components/
│   └── package.json
└── package.json      # Root package.json with convenience scripts
```

## 🚀 Quick Start

### 1. Install Dependencies

Install dependencies for all parts of the project:

```bash
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Backend dependencies
npm run backend:install

# Frontend dependencies
npm run frontend:install
```

### 2. Configure Environment Variables

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

**Note**: The `JWT_SECRET` is used to sign authentication tokens. Use a strong, random secret in production.

#### Frontend Configuration

Create `frontend/.env.local` file:

```bash
cp frontend/.env.example frontend/.env.local
```

The default configuration should work:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ANTHROPIC_API_KEY=your-api-key-here
NEXT_PUBLIC_ANTHROPIC_BASE_URL=https://api.anthropic.com
```

**Note**: You can also configure these settings through the Settings page in the dashboard after logging in. Settings configured in the UI take precedence over environment variables.

### 3. Start Development Servers

#### Option 1: Run Both Servers (Recommended)

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
npm run backend:dev
```

**Terminal 2 - Frontend:**
```bash
npm run frontend:dev
```

#### Option 2: Run Individually

**Backend only:**
```bash
cd backend
npm run dev
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

### 5. First Login

1. Navigate to http://localhost:3000
2. You'll see the login page
3. Login with the default admin credentials:
   - **Username**: `admin`
   - **Password**: `admin`
4. You'll see a security reminder to change your password
5. Click "Change Password" and update to a secure password
6. The reminder will disappear after you change your password

## ⚙️ Configuration Management

The dashboard includes a Settings page where you can configure application settings without modifying environment variables or restarting the server.

### Accessing Settings

1. After logging in, click on the **Settings** tab in the main navigation
2. You'll see the Settings page with configuration options

### Available Settings

#### Anthropic API Configuration

- **Anthropic API Key**: Enter your Anthropic API key
  - Stored securely in browser's localStorage
  - Takes precedence over environment variables when set
  - Can be reset to default (from environment variables)

- **Anthropic Base URL**: Configure the API base URL
  - Default: `https://api.anthropic.com`
  - Can be customized for different API endpoints

### How Configuration Works

1. **Priority Order**:
   - Settings saved in browser localStorage (highest priority)
   - Environment variables (`NEXT_PUBLIC_ANTHROPIC_API_KEY`, `NEXT_PUBLIC_ANTHROPIC_BASE_URL`)
   - Default values

2. **Storage**:
   - Configuration is stored in browser's localStorage
   - Settings persist across browser sessions
   - Each user's browser has its own configuration

3. **Reset to Defaults**:
   - Click "Reset to Defaults" to restore environment variable values
   - Clears localStorage configuration

### Configuration Best Practices

- **Development**: Use the Settings page for quick testing and configuration changes
- **Production**: Use environment variables for consistent configuration across deployments
- **Security**: API keys in localStorage are browser-specific and not shared across devices

## 🔐 Authentication

The application includes a complete authentication system with user management:

### Default Admin User

On first startup, a default admin user is automatically created:
- **Username**: `admin`
- **Password**: `admin`
- **Email**: `admin@localhost`

⚠️ **Security Note**: You will be prompted to change the default password on first login. This is required for security.

### User Registration

New users can register through the registration form:
- Username (unique)
- Email (unique)
- Password (minimum 6 characters)

### Password Security

- Passwords are hashed using bcrypt
- Default admin password must be changed on first login
- Password change reminder appears until password is updated
- JWT tokens are used for session management (7-day expiration)

### Authentication Flow

1. **Login/Register**: Users authenticate through the login or registration page
2. **Token Storage**: JWT tokens are stored in browser localStorage
3. **Protected Routes**: All API endpoints require authentication
4. **Password Reminder**: Users with default passwords see a security reminder banner

## 🛠️ Development

### Backend API Endpoints

#### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with username/email and password
- `GET /api/auth/me` - Get current authenticated user info
- `POST /api/auth/change-password` - Change user password (requires authentication)

#### Application Endpoints (All require authentication)
- `POST /api/code-review` - Run code review
- `GET /api/code-review/reports` - List code review reports
- `POST /api/threat-modeling` - Run threat modeling
- `GET /api/threat-modeling/reports` - List threat modeling reports
- `POST /api/chat` - Send chat message
- `GET /api/health` - Health check

### Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Express.js, TypeScript
- **Database**: SQLite (better-sqlite3) - local user storage
- **Authentication**: JWT (jsonwebtoken), bcrypt for password hashing
- **UI Components**: shadcn-ui (Radix UI components)

## 🧪 Testing

The project includes comprehensive test suites for both backend and frontend.

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run backend tests only:**
```bash
npm run backend:test
# or
cd backend && npm test
```

**Run frontend tests only:**
```bash
npm run frontend:test
# or
cd frontend && npm test
```

**Run tests in watch mode:**
```bash
cd backend && npm run test:watch
cd frontend && npm run test:watch
```

**Generate test coverage:**
```bash
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

### Test Coverage

**Backend Tests:**
- User model tests (create, find, verify password, change password)
- Authentication routes (register, login, change password, get current user)
- Authentication middleware (token generation and verification)

**Frontend Tests:**
- API client tests (all authentication methods)
- AuthContext tests (login, logout, password change, state management)

## 📦 Building for Production

### Backend

```bash
npm run backend:build
npm run backend:start
```

### Frontend

```bash
npm run frontend:build
npm run frontend:start
```

## 🔧 Troubleshooting

### Backend Issues

1. **Configuration file not found**: Ensure `appsec-agent` package is built and the config file exists at `../appsec-agent/conf/appsec_agent.yaml`

2. **Port already in use**: Change `PORT` in `backend/.env`

3. **Database errors**: The SQLite database is automatically created in `backend/data/users.db`. Ensure the `backend/data` directory is writable.

4. **Authentication errors**: 
   - Check that `JWT_SECRET` is set in `backend/.env`
   - Verify the database was created successfully
   - Check backend logs for initialization messages

### Frontend Issues

1. **API connection errors**: Ensure backend is running on port 3001

2. **Build errors**: Check that all dependencies are installed

3. **Component errors**: Verify shadcn-ui components are properly set up

4. **Authentication not working**: 
   - Check that `NEXT_PUBLIC_API_URL` is correct in `frontend/.env.local`
   - Verify backend is running and accessible
   - Check browser console for API errors

### Common Fixes

- Clear `node_modules` and reinstall:
  ```bash
  rm -rf node_modules backend/node_modules frontend/node_modules
  npm run install:all
  ```

- Check TypeScript compilation:
  ```bash
  cd backend && npm run build
  cd ../frontend && npm run build
  ```

## 📚 Next Steps

1. Customize the UI components in `frontend/components/`
2. Add more API endpoints in `backend/src/routes/`
3. Implement file upload functionality for repositories
4. ✅ Authentication and authorization (implemented)
5. ✅ Settings interface for configuration management (implemented)
6. Implement report download functionality
7. Add more security analysis features
8. Add user roles and permissions
9. Implement password reset functionality

## 🎯 Tech Stack Summary

✅ **Frontend**: React/Next.js (as requested)  
✅ **UI Components**: shadcn-ui (using MCP server)  
✅ **Backend**: Express.js (as requested)  

