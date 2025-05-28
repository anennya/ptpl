import React from 'react';
import { Link } from 'react-router-dom';
import { Home, BookOpen } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <BookOpen className="w-24 h-24 text-primary-300 mb-6" />
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="text-xl text-gray-600 max-w-xl mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <Link to="/" className="btn btn-primary flex items-center justify-center">
          <Home className="w-5 h-5 mr-2" />
          <span>Go to Dashboard</span>
        </Link>
        <Link to="/books" className="btn btn-secondary flex items-center justify-center">
          <BookOpen className="w-5 h-5 mr-2" />
          <span>Browse Books</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;