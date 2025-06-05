# Prestige Tranquility Public Library

A modern library management system built with React, TypeScript, and Supabase. This application enables libraries to manage their book collections, track member information, handle circulation (borrowing/returning), and generate reports.

## Features

- **Authentication & Authorization**: Multi-organization support with role-based access control (admin, volunteer, member)
- **Book Management**: Add, edit, and track books with ISBN scanning support
- **Member Management**: Manage library member information and permissions
- **Circulation System**: Handle book borrowing and returns with due date tracking
- **Reports**: Generate circulation and inventory reports
- **Admin Panel**: Organization and user management with invitation system

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Build Tool**: Vite
- **Routing**: React Router
- **Icons**: Heroicons, Lucide React
- **Charts**: Recharts
- **Barcode Scanning**: Quagga2

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ptpl
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Supabase locally** (optional for local development)
   ```bash
   supabase start
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Visit the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser

### Supabase Edge Functions

The application uses Supabase Edge Functions for authentication and organization management.

#### Setting up Edge Functions

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g @supabase/cli
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Deploy Edge Functions**
   ```bash
   supabase functions deploy auth-api
   ```

#### Edge Function Development

The main edge function is located at `supabase/functions/auth-api/index.ts` and handles:

- User authentication and authorization
- Organization management
- Member invitations and role management
- Permission checking

To develop edge functions locally:

```bash
# Start local Supabase (includes edge functions)
supabase start

# Serve functions locally
supabase functions serve auth-api --env-file .env.local
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run test:books` - Run book service tests

## Database Schema

The application uses PostgreSQL with the following main tables:

- `organizations` - Library organizations
- `organization_members` - User-organization relationships with roles
- `invitations` - Member invitation system
- `books` - Book catalog
- `members` - Library members
- `circulation` - Book borrowing/return records

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and tests
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use Tailwind CSS for styling
- Write meaningful commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support, please open an issue in the GitHub repository.
