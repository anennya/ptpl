import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, BookOpen, User, Calendar, X, Check, Camera, Grid, List } from 'lucide-react';
import { Book } from '../types';
import { getAllBooks, searchBooks, addBook } from '../services/bookService';
import { fetchBookByISBN } from '../services/bookApiService';
import ISBNScanner from '../components/ISBNScanner';

const ManageBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'Borrowed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Add view mode state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add these new state variables for the modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  // Update the newBook state to include the additional fields
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiction' as 'Fiction' | 'Non-Fiction' | 'Children',
    coverUrl: '',
    bookNumber: '',
    language: 'English',
    price: '',
    publisher: '',
    donatedBy: '',
    storageLocation: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Add modal functions
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewBook((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleISBNDetected = async (isbn: string) => {
    setIsLoading(true);
    setScannerError(null);
    try {
      const bookData = await fetchBookByISBN(isbn);
      if (bookData) {
        setNewBook((prev) => {
          // Ensure category is one of the allowed values
          const category = (bookData.category && 
            (bookData.category === "Fiction" || 
             bookData.category === "Non-Fiction" || 
             bookData.category === "Children")) 
            ? bookData.category 
            : "Fiction";
          
          return {
            ...prev,
            title: bookData.title || prev.title,
            author: bookData.author || prev.author,
            isbn: isbn,
            category: category,
            coverUrl: bookData.coverUrl || prev.coverUrl,
          };
        });
        setIsScannerActive(false);
      }
    } catch (err) {
      console.error('Error fetching book data:', err);
      setScannerError('Failed to fetch book information. Please enter details manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScannerError = (error: string) => {
    setScannerError(error);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await addBook({
        ...newBook,
        status: "Available",
        coverUrl:
          newBook.coverUrl ||
          "https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg",
      });

      if (result) {
        setIsAddModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setNewBook({
          title: "",
          author: "",
          isbn: "",
          category: "Fiction",
          coverUrl: "",
          bookNumber: "",
          language: "English",
          price: "",
          publisher: "",
          donatedBy: "",
          storageLocation: "",
        });
        loadBooks();
      } else {
        throw new Error("Failed to add book");
      }
    } catch (err) {
      setError("Failed to add book. Please try again.");
      console.error("Error adding book:", err);
    } finally {
      setIsLoading(false);
    }
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

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredBooks.map(book => (
        <Link 
          key={book.id}
          to={`/manage-books/${book.id}`}
          className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
        >
          <div className="aspect-[3/4] relative overflow-hidden">
            <img
              src={
                book.coverUrl ||
                "https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg"
              }
              alt={book.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(book.status)}`}
              >
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
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(book.category)}`}>
                {book.category}
              </span>
              <span className="text-sm text-gray-500">
                {book.borrowCount} borrows
              </span>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Borrows
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ISBN
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBooks.map(book => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/manage-books/${book.id}`}
                      className="flex items-center space-x-3 group"
                    >
                      <div className="flex-shrink-0 h-12 w-8">
                        <img
                          src={
                            book.coverUrl ||
                            "https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg"
                          }
                          alt={book.title}
                          className="h-full w-full object-cover rounded"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                          {book.title}
                        </div>
                        <div className="text-sm text-gray-500">{book.author}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(book.category)}`}>
                      {book.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(book.status)}`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {book.borrowCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {book.isbn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
            <p className="text-lg text-gray-600">Add, edit, and view book details</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Grid View"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List View"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary inline-flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span>Add New Book</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
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
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Available' | 'Borrowed')}
                  className="input-field"
                >
                  <option value="all">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Borrowed">Borrowed</option>
                </select>
              </div>
              
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Categories</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Children">Children's Books</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Books Display */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-500">Loading books...</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          viewMode === 'grid' ? renderGridView() : renderListView()
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery ? 'No books found' : 'No books yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Get started by adding your first book'
              }
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Add First Book</span>
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {filteredBooks.length > 0 && (
          <div className="text-center text-gray-500">
            Showing {filteredBooks.length} of {books.length} books
          </div>
        )}

        {/* Add Book Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleAddBook}>
                  <div className="bg-white px-6 pt-5 pb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">
                        Add New Book
                      </h3>
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
                        <span>
                          {isScannerActive ? "Cancel Scan" : "Scan ISBN"}
                        </span>
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
                        <p className="mt-2 text-sm text-red-600">
                          {scannerError}
                        </p>
                      )}

                      {isLoading && (
                        <div className="mt-2 text-sm text-gray-600">
                          Fetching book information...
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="title"
                          className="block text-lg font-medium text-gray-700 mb-1"
                        >
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
                        <label
                          htmlFor="author"
                          className="block text-lg font-medium text-gray-700 mb-1"
                        >
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
                        <label
                          htmlFor="isbn"
                          className="block text-lg font-medium text-gray-700 mb-1"
                        >
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
                        <label
                          htmlFor="category"
                          className="block text-lg font-medium text-gray-700 mb-1"
                        >
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
                        <label htmlFor="bookNumber" className="block text-lg font-medium text-gray-700 mb-1">
                          Book Number
                        </label>
                        <input
                          type="text"
                          id="bookNumber"
                          name="bookNumber"
                          className="input-field"
                          value={newBook.bookNumber}
                          onChange={handleInputChange}
                          placeholder="e.g., BK001"
                        />
                      </div>

                      <div>
                        <label htmlFor="language" className="block text-lg font-medium text-gray-700 mb-1">
                          Language
                        </label>
                        <input
                          type="text"
                          id="language"
                          name="language"
                          className="input-field"
                          value={newBook.language}
                          onChange={handleInputChange}
                          placeholder="e.g., English"
                        />
                      </div>

                      <div>
                        <label htmlFor="price" className="block text-lg font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <input
                          type="text"
                          id="price"
                          name="price"
                          className="input-field"
                          value={newBook.price}
                          onChange={handleInputChange}
                          placeholder="e.g., ₹500"
                        />
                      </div>

                      <div>
                        <label htmlFor="publisher" className="block text-lg font-medium text-gray-700 mb-1">
                          Publisher
                        </label>
                        <input
                          type="text"
                          id="publisher"
                          name="publisher"
                          className="input-field"
                          value={newBook.publisher}
                          onChange={handleInputChange}
                          placeholder="e.g., Penguin Books"
                        />
                      </div>

                      <div>
                        <label htmlFor="donatedBy" className="block text-lg font-medium text-gray-700 mb-1">
                          Donated By
                        </label>
                        <input
                          type="text"
                          id="donatedBy"
                          name="donatedBy"
                          className="input-field"
                          value={newBook.donatedBy}
                          onChange={handleInputChange}
                          placeholder="e.g., John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="storageLocation" className="block text-lg font-medium text-gray-700 mb-1">
                          Storage Location
                        </label>
                        <input
                          type="text"
                          id="storageLocation"
                          name="storageLocation"
                          className="input-field"
                          value={newBook.storageLocation}
                          onChange={handleInputChange}
                          placeholder="e.g., Shelf A, Row 3"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="coverUrl"
                          className="block text-lg font-medium text-gray-700 mb-1"
                        >
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
                      {isLoading ? "Adding..." : "Add Book"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <Check className="h-5 w-5" />
            <span>Book added successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBooks; 