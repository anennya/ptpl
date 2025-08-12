import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Users, BookOpen } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-4">
      {/* Simple subtitle only */}
      <div className="text-center mb-4">
        <p className="text-lg md:text-xl text-gray-600">
          What would you like to do today?
        </p>
      </div>

      {/* 2x2 Grid for mobile - all buttons visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
        <Link 
          to="/borrow"
          className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 text-center hover:scale-105"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
            <ArrowRight className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Borrow</h3>
          <p className="text-xs text-gray-600">Issue books</p>
        </Link>

        <Link 
          to="/return"
          className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 text-center hover:scale-105"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Return</h3>
          <p className="text-xs text-gray-600">Return books</p>
        </Link>

        <Link 
          to="/manage-members"
          className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 text-center hover:scale-105"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Members</h3>
          <p className="text-xs text-gray-600">Manage members</p>
        </Link>

        <Link 
          to="/manage-books"
          className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 text-center hover:scale-105"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
            <BookOpen className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Books</h3>
          <p className="text-xs text-gray-600">Manage books</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;