# TimeSheet Management Frontend

A modern React TypeScript application for time sheet management with authentication pages.

## Features

- 🔐 Login page
- 📝 Registration page
- 👋 Welcome page
- 🎨 Modern, responsive UI
- ⚡ Built with Vite for fast development

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
  ├── pages/
  │   ├── Login.tsx
  │   ├── Registration.tsx
  │   ├── Welcome.tsx
  │   ├── Auth.css
  │   └── Welcome.css
  ├── App.tsx
  ├── main.tsx
  └── index.css
```

## Routes

- `/` - Redirects to `/login`
- `/login` - Login page
- `/register` - Registration page
- `/welcome` - Welcome page (after login/registration)

