import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, BookOpen, User, Calendar } from 'lucide-react';
import { Book } from '../types';
import { getAllBooks, searchBooks } from '../services/bookService';

const ManageBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'Borrowed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [books, searchQuery, statusFilter, categoryFilter]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const data = await getAllBooks();
      setBooks(data);
      setFilteredBooks(data);
    } catch (err) {
      console.error('Error loading books:', err);
      setError('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setFilteredBooks(books);
      return;
    }
    
    try {
      setIsLoading(true);
      const searchResults = await searchBooks(searchQuery);
      setBooks(searchResults);
    } catch (err) {
      console.error('Error searching books:', err);
      setError('Failed to search books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadBooks(); // Reload all books when search is cleared
    }
  };

  const applyFilters = () => {
    let filtered = books;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(book => book.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(book => book.category === categoryFilter);
    }

    setFilteredBooks(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Borrowed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Fiction':
        return 'bg-purple-100 text-purple-800';
      case 'Non-Fiction':
        return 'bg-orange-100 text-orange-800';
      case 'Children':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Books</h1>
            <p className="text-lg text-gray-600">Add, edit, and view book catalog</p>
          </div>
          
          <Link 
            to="/admin"
            className="btn btn-primary inline-flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Add New Book</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <form onSubmit={handleSearch} className="relative mb-4">
            <input
              type="text"
              placeholder="Search books by title, author, or ISBN..."
              className="input-field pl-10 w-full"
              value={searchQuery}
              onChange={handleSearchInputChange}
              disabled={isLoading}
            />
            <Search className="absolute left-3 top-4 h-6 w-6 text-gray-400" />
            <button 
              type="submit" 
              className="btn btn-primary absolute right-1 top-1"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Available' | 'Borrowed')}
                className="input-field w-full"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Borrowed">Borrowed</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Categories</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Children">Children</option>
              </select>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-500">Loading books...</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => (
              <Link 
                key={book.id}
                to={`/manage-books/${book.id}`}
                className="card hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                      <BookOpen className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-gray-600">by {book.author}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <span className="text-sm">ISBN: {book.isbn}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(book.category)}`}>
                      {book.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(book.status)}`}>
                      {book.status}
                    </span>
                  </div>
                  
                  {book.status === 'Borrowed' && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <User className="h-4 w-4 mr-1" />
                      <span>Borrowed by member</span>
                    </div>
                  )}
                  
                  {book.dueDate && book.status === 'Borrowed' && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Due: {new Date(book.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      Borrowed {book.borrowCount} times
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
                ? 'No books found' 
                : 'No books yet'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search terms or filters' 
                : 'Get started by adding your first book'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
              <Link 
                to="/admin"
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Add First Book</span>
              </Link>
            )}
          </div>
        )}

        {/* Results count */}
        {filteredBooks.length > 0 && (
          <div className="text-center text-gray-500">
            Showing {filteredBooks.length} of {books.length} books
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBooks; 