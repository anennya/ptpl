# Prestige Tranquility People's Library Management System

A modern, full-stack library management system built with React, TypeScript, and Supabase. This application provides comprehensive book and member management capabilities with role-based access control and mobile-responsive design.

##  Features

### Core Functionality
- **Book Management**: Add, edit, view, and manage books with detailed information
- **Member Management**: Register and manage library members with membership tracking
- **Circulation System**: Streamlined borrow and return processes
- **Fine Management**: Track overdue books and manage fines
- **Admin Panel**: Administrative controls and system management

### User Experience
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Role-Based Access**: Different permissions for different user types
- **Real-time Updates**: Live data synchronization with Supabase
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS

### Technical Features
- **Authentication**: Secure user authentication with Supabase Auth
- **Database**: PostgreSQL database with Supabase
- **Type Safety**: Full TypeScript implementation
- **Modern Stack**: React 18, Vite, and modern tooling

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Date-fns** - Date manipulation

### Backend & Database
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Supabase Auth** - Authentication
- **Row Level Security (RLS)** - Database security

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── navigation/     # Header, Sidebar, etc.
│   └── PermissionGate.tsx
├── contexts/           # React contexts
│   └── useAuth.tsx     # Authentication context
├── layouts/            # Layout components
│   └── MainLayout.tsx  # Main application layout
├── lib/                # Utility libraries
│   └── supabase.ts     # Supabase client configuration
├── pages/              # Application pages
│   ├── Home.tsx        # Landing page
│   ├── Login.tsx       # Authentication
│   ├── Borrow.tsx      # Book borrowing flow
│   ├── Return.tsx      # Book return flow
│   ├── ManageBooks.tsx # Book management
│   ├── ManageMembers.tsx # Member management
│   ├── AdminPanel.tsx  # Administrative functions
│   └── ...            # Other pages
├── services/           # API and business logic
│   ├── bookService.ts  # Book-related operations
│   ├── memberService.ts # Member-related operations
│   ├── circulationService.ts # Circulation operations
│   └── finesService.ts # Fine management
├── types/              # TypeScript type definitions
│   └── index.ts        # Main type definitions
└── App.tsx             # Main application component

supabase/
├── migrations/         # Database migrations
├── functions/          # Edge functions
└── config.toml         # Supabase configuration
```

This README provides a comprehensive overview of your library management system, including:

- **Feature overview** - All the key functionality
- **Tech stack details** - Complete list of technologies used
- **Project structure** - Clear organization of the codebase
- **Setup instructions** - Step-by-step installation guide
- **Database schema** - Overview of the data structure
- **Authentication & permissions** - Security features
- **Mobile responsiveness** - Cross-device compatibility
- **Deployment instructions** - How to deploy the application

The README is structured to be helpful for both developers working on the project and stakeholders who need to understand the system's capabilities.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ptpl
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   ```bash
   # Apply database migrations
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test:books` - Run book-related tests

## 📊 Database Schema

### Key Tables

#### Books
- Book information (title, author, ISBN, etc.)
- Availability tracking
- Current borrower information
- Storage and donation details

#### Members
- Member registration and contact information
- Membership status and dates
- Payment tracking
- Fine management

#### Loans
- Book borrowing records
- Due dates and return tracking
- Renewal information

#### Fines
- Overdue fine tracking
- Payment and waiver management
- Administrative oversight

## 🔐 Authentication & Permissions

The system uses role-based access control with the following permission levels:

- **Admin**: Full system access
- **Librarian**: Circulation and management access
- **Member**: View-only access to personal information

Permissions are enforced through:
- Supabase Row Level Security (RLS)
- Frontend permission gates
- Route protection

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones

Key mobile features:
- Collapsible sidebar navigation
- Touch-friendly interface
- Optimized layouts for small screens
- Responsive grids and forms

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Intuitive Navigation**: Easy-to-use sidebar and breadcrumbs
- **Visual Feedback**: Loading states, success/error messages
- **Accessibility**: ARIA labels and keyboard navigation
- **Consistent Styling**: Unified design system with Tailwind CSS

## 📝 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Apply the database migrations
3. Configure Row Level Security policies
4. Set up authentication providers

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy automatically on push

### Supabase Deployment
```bash
npx supabase db push
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is private and proprietary.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Contact the development team

---

**Built with ❤️ for Prestige Tranquility People's Library**