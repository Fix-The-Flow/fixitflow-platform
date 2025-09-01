# FixItFlow 🔧

A playful, user-friendly troubleshooting platform that helps users solve everyday problems across categories like DIY, self-care, tech, pets, home repair, and more.

## Features 🌟

### Core Platform
- **Searchable Guide System** - Browse and follow step-by-step troubleshooting flows
- **Severity Levels** - Guides categorized by urgency (low, medium, high, critical)
- **Difficulty Ratings** - Beginner, intermediate, and advanced skill levels
- **Progress Tracking** - Save progress on guides and resume where you left off
- **Mobile Optimized** - Responsive design for all devices

### AI-Powered eBook Publishing
- **Brainstorm Ideas** - AI generates eBook concepts from popular guides
- **Auto-Generated Outlines** - Create comprehensive eBook structures
- **Chapter Writing Assistant** - AI helps draft engaging content
- **Title Suggestions** - Generate compelling, SEO-friendly titles
- **Export Options** - ePub and PDF format support (coming soon)

### eBook Storefront
- **Public Library** - Browse, preview, and purchase eBooks
- **Advanced Filtering** - Filter by category, author, price, and popularity
- **Secure Payments** - Stripe integration for safe transactions
- **Digital Downloads** - Instant access to purchased content

### User Experience
- **Playful Mascot System** - Choose from 5 friendly characters (Wizard, Robot, Cat, Dog, Bear)
- **Contextual Tips** - Encouraging messages and safety reminders
- **User Accounts** - Save guides, track purchases, and monitor progress
- **Admin Dashboard** - Complete content management system

## Tech Stack 💻

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with bcrypt password hashing
- **Stripe API** for payment processing
- **OpenAI API** for AI content generation
- **Express Rate Limiting** and security middleware

### Frontend
- **React 18** with modern hooks and context
- **React Router** for client-side routing
- **React Query** for server state management
- **Tailwind CSS** for responsive styling
- **Framer Motion** for smooth animations
- **React Hook Form** for form handling

## Quick Start 🚀

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Stripe account (for payments)
- OpenAI API key (for AI features)

### Installation

1. **Clone and setup the project:**
```bash
git clone <repository-url>
cd fixitflow
npm run install-deps
```

2. **Configure environment variables:**
```bash
cd server
cp .env.example .env
```

Edit `.env` with your configuration:
- MongoDB connection string
- JWT secret key
- Stripe API keys
- OpenAI API key

3. **Seed the database:**
```bash
npm run seed
```

4. **Start the development servers:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Accounts 👤

After seeding the database:

**Admin Account:**
- Email: admin@fixitflow.com
- Password: admin123

**Sample User:**
- Email: john@example.com
- Password: password123

## Mascot Characters 🎭

Choose from 5 friendly assistants:

- **🧙‍♂️ Wizard Wesley** - Wise and encouraging
- **🤖 Robo Helper** - Logical and efficient  
- **🐱 Whiskers** - Curious and playful
- **🐕 Buddy** - Friendly and loyal
- **🐻 Bruno** - Gentle and supportive

---

**Made with ❤️ for problem-solvers everywhere**

*FixItFlow - Because every problem has a solution, and every solution can be fun!*

# FixItFlow - Troubleshooting App

FixItFlow is a comprehensive troubleshooting application that helps users diagnose and fix everyday issues across various categories including technology, home maintenance, automotive, and pets.

## Features

### Core Features
- **User Authentication**: Sign up/sign in with email, phone verification, and social login
- **Subscription Management**: Free tier and Premium ($4.99/month, $39.99/year, $1.99/day)
- **Troubleshooting Guides**: Step-by-step solutions for common problems
- **AI Assistant**: "Helpful Handy" chatbot for 24/7 support
- **Premium Features**: AI chat, image upload, video chat support
- **Admin Dashboard**: Content management, analytics, user moderation

### Technical Features
- Responsive web design
- Secure payment processing (Stripe/PayPal)
- Real-time notifications
- Image upload and processing
- Advanced search and filtering
- User profile management
- Data encryption and security

## Project Structure

```
FixItFlow/
├── frontend/          # React.js frontend application
├── backend/           # Node.js/Express API server
├── shared/            # Shared utilities and types
├── README.md          # This file
└── docker-compose.yml # Development environment setup
```

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. Set up environment variables (see .env.example files)

4. Start development servers:
   ```bash
   # Backend (port 5000)
   cd backend && npm run dev
   
   # Frontend (port 3000)
   cd ../frontend && npm start
   ```

### Environment Setup

Create `.env` files in both frontend and backend directories with the required environment variables.

## Technologies Used

### Frontend
- React.js with TypeScript
- Material-UI for components
- React Router for navigation
- Axios for API calls
- Socket.io for real-time features

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Stripe/PayPal for payments
- Nodemailer for emails
- Socket.io for real-time communication
- OpenAI API for AI features

## License

Private - All rights reserved
