# SEO Content Generator - MERN Stack Application

A full-stack web application that integrates Google AI Studio (Gemini API) to automate SEO content generation workflows.

## Features

- **SEO Content Generation**: Generate optimized blog outlines, meta titles, meta descriptions, and internal links
- **User Authentication**: JWT-based registration and login system
- **Usage Quotas**: Free users get 5 AI generations with usage tracking
- **Content History**: View and manage past generated content
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Rate Limiting**: API protection and abuse prevention
- **Multi-Tenant**: Data isolation between users

## Tech Stack

### Frontend
- React.js with functional components and hooks
- Tailwind CSS for styling
- Context API for state management
- Axios for API communication

### Backend
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Google AI Studio (Gemini API) integration
- Express rate limiting

### Database
- MongoDB Atlas for cloud storage
- User data, generated content, and usage logs

## Project Structure

```
seo-generator/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Google AI Studio API key

### Installation

1. Clone the repository
2. Set up backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Add your API keys to .env
   npm run dev
   ```

3. Set up frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Environment Variables

Backend `.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_ai_studio_api_key
PORT=5000
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### SEO Generation
- `POST /api/seo/generate` - Generate SEO content
- `GET /api/seo/history` - Get user's generation history
- `GET /api/seo/usage` - Get remaining usage quota

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Backend (Render)
1. Connect GitHub repository to Render
2. Set environment variables
3. Deploy automatically on push

### Database (MongoDB Atlas)
1. Create free tier cluster
2. Configure network access
3. Add connection string to environment variables

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## License

MIT License
