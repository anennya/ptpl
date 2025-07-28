import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ArrowRight, ArrowLeft } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Prestige Tranquility People's Library</h1>
        <p className="text-xl text-gray-600">What would you like to do today?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Link 
          to="/borrow"
          className="card group hover:shadow-lg transition-shadow p-8 text-center flex flex-col items-center space-y-4"
        >
          <div className="p-4 rounded-full bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
            <ArrowRight className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Borrow</h2>
          <p className="text-gray-600">Issue books to library members</p>
        </Link>

        <Link 
          to="/return"
          className="card group hover:shadow-lg transition-shadow p-8 text-center flex flex-col items-center space-y-4"
        >
          <div className="p-4 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
            <ArrowLeft className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Return</h2>
          <p className="text-gray-600">Return books from library members</p>
        </Link>

        <Link 
          to="/manage-members"
          className="card group hover:shadow-lg transition-shadow p-8 text-center flex flex-col items-center space-y-4"
        >
          <div className="p-4 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Manage Members</h2>
          <p className="text-gray-600">Add, edit, or view member details</p>
        </Link>

        <Link 
          to="/manage-books"
          className="card group hover:shadow-lg transition-shadow p-8 text-center flex flex-col items-center space-y-4"
        >
          <div className="p-4 rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Manage Books</h2>
          <p className="text-gray-600">Add, edit, or view book catalog</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;