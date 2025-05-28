import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, UserPlus, X, Check, Filter, Camera } from 'lucide-react';
import { Book } from '../types';
import { getAllBooks, searchBooks, addBook } from '../services/bookService';
import { fetchBookByISBN } from '../services/bookApiService';
import ISBNScanner from '../components/ISBNScanner';

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiction' as 'Fiction' | 'Non-Fiction' | 'Children',
    coverUrl: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [searchQuery, filterCategory, filterStatus]);

  const loadBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let filteredBooks: Book[] = [];
      
      if (searchQuery.trim()) {
        filteredBooks = await searchBooks(searchQuery);
      } else {
        filteredBooks = await getAllBooks();
      }
      
      if (filterCategory !== 'All') {
        filteredBooks = filteredBooks.filter(book => book.category === filterCategory);
      }
      
      if (filterStatus !== 'All') {
        filteredBooks = filteredBooks.filter(book => book.status === filterStatus);
      }
      
      setBooks(filteredBooks);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error('Error loading books:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (previous handler methods remain the same)

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map(book => (
        <Link
          to={`/books/${book.id}`}
          key={book.id}
          className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
        >
          <div className="aspect-[3/4] relative overflow-hidden">
            <img
              src={book.coverUrl || 'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg'}
              alt={book.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(book.status)}`}>
                {book.status}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600">
              {book.title}
            </h3>
            <p className="text-gray-600 mt-1">{book.author}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">{book.category}</span>
              <span className="text-sm text-gray-500">{book.borrowCount} borrows</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-md rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-primary-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Title & Author
                </th>
                <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  ISBN
                </th>
                <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-right text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {books.map(book => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={book.coverUrl || 'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg'}
                        alt={book.title}
                        className="h-16 w-12 object-cover rounded"
                      />
                      <div className="ml-4">
                        <Link to={`/books/${book.id}`} className="font-medium text-primary-700 hover:text-primary-900 text-lg">
                          {book.title}
                        </Link>
                        <p className="text-gray-600">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                    {book.isbn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                    {book.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(book.status)}`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-lg">
                    <Link
                      to={`/books/${book.id}`}
                      className="text-primary-600 hover:text-primary-900 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (isLoading && books.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading books...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        {/* Header with search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-2">Books</h1>
            <p className="text-lg text-gray-600">Manage your library's book collection.</p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                className="input-field pl-10 w-full md:w-72"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-4 h-6 w-6 text-gray-400" />
            </form>
            
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary flex items-center justify-center space-x-2"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              <span>Book added successfully!</span>
            </div>
            <button onClick={() => setShowSuccess(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-6 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <div>
              <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="filterCategory"
                className="block w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Children">Children's Books</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="filterStatus"
                className="block w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Borrowed">Borrowed</option>
                <option value="Reserved">Reserved</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
          
          <div className="md:ml-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              View
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
        
        {/* Books Display */}
        {books.length > 0 ? (
          viewMode === 'grid' ? renderGridView() : renderListView()
        ) : (
          <div className="text-center py-12">
            <PlusCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No books found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery
                ? 'Try a different search query.'
                : 'Get started by adding some books to your library.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary"
              >
                Add New Book
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddBook}>
                <div className="bg-white px-6 pt-5 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Add New Book</h3>
                    <button 
                      type="button" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* ISBN Scanner */}
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setIsScannerActive(!isScannerActive)}
                      className="btn btn-secondary w-full flex items-center justify-center"
                      disabled={isLoading}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      <span>{isScannerActive ? 'Cancel Scan' : 'Scan ISBN'}</span>
                    </button>

                    {isScannerActive && (
                      <div className="mt-4">
                        <ISBNScanner
                          onDetected={handleISBNDetected}
                          onError={handleScannerError}
                        />
                      </div>
                    )}

                    {scannerError && (
                      <p className="mt-2 text-sm text-red-600">{scannerError}</p>
                    )}

                    {isLoading && (
                      <div className="mt-2 text-sm text-gray-600">
                        Fetching book information...
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        className="input-field"
                        value={newBook.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="author" className="block text-lg font-medium text-gray-700 mb-1">
                        Author
                      </label>
                      <input
                        type="text"
                        id="author"
                        name="author"
                        className="input-field"
                        value={newBook.author}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="isbn" className="block text-lg font-medium text-gray-700 mb-1">
                        ISBN
                      </label>
                      <input
                        type="text"
                        id="isbn"
                        name="isbn"
                        className="input-field"
                        value={newBook.isbn}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-lg font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        className="input-field"
                        value={newBook.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Children">Children's Books</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="coverUrl" className="block text-lg font-medium text-gray-700 mb-1">
                        Cover Image URL (optional)
                      </label>
                      <input
                        type="url"
                        id="coverUrl"
                        name="coverUrl"
                        className="input-field"
                        value={newBook.coverUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/book-cover.jpg"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Leave empty to use a default cover image
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;