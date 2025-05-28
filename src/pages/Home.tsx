import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Search } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Prestige Tranquility Library</h1>
        <p className="text-xl text-gray-600">What would you like to do today?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link 
          to="/circulation"
          className="card group hover:shadow-lg transition-shadow p-8 text-center flex flex-col items-center space-y-4"
        >
          <div className="p-4 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Borrow/Return</h2>
          <p className="text-gray-600">Issue or return books for library members</p>
        </Link>

        <Link 
          to="/members"
          className="card group hover:shadow-lg transition-shadow p-8 text-center flex flex-col items-center space-y-4"
        >
          <div className="p-4 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Manage Members</h2>
          <p className="text-gray-600">Add, edit, or view member details</p>
        </Link>

        <Link 
          to="/books"
          className="card group hover:shadow-lg transition-shadow p-8 text-center flex flex-col items-center space-y-4"
        >
          <div className="p-4 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Search Books</h2>
          <p className="text-gray-600">Browse and search library catalog</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;