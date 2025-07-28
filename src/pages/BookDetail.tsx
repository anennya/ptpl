import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash, BookOpen, Calendar, Activity, Check, X } from 'lucide-react';
import { Book, Member } from '../types';
import { getBookById, updateBook, deleteBook } from '../services/bookService';
import { getMemberById } from '../services/memberService';

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [borrower, setBorrower] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editedBook, setEditedBook] = useState<Partial<Book>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBook = async () => {
      if (id) {
        try {
          const bookData = await getBookById(id);
          
          if (bookData) {
            setBook(bookData);
            setEditedBook({
              title: bookData.title,
              author: bookData.author,
              isbn: bookData.isbn,
              category: bookData.category,
              status: bookData.status,
            });
            
            // Get borrower details if book is borrowed
            if (bookData.status === 'Borrowed' && bookData.borrowedByMemberId) {
              const memberData = await getMemberById(bookData.borrowedByMemberId);
              if (memberData) {
                setBorrower(memberData);
              }
            }
          }
        } catch (err) {
          setError('Failed to load book details');
          console.error('Error loading book:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadBook();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedBook(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (book && editedBook) {
      try {
        const updatedBook = {
          ...book,
          title: editedBook.title || book.title,
          author: editedBook.author || book.author,
          isbn: editedBook.isbn || book.isbn,
          category: editedBook.category || book.category,
          status: editedBook.status as 'Available' | 'Borrowed' | 'Reserved' | 'Lost' || book.status,
        };
        
        // If changing status from Borrowed to something else, clear borrower info
        if (book.status === 'Borrowed' && updatedBook.status !== 'Borrowed') {
          updatedBook.borrowedBy = undefined;
          updatedBook.dueDate = undefined;
        }
        
        const result = await updateBook(updatedBook);
        if (result) {
          setBook(result);
          setIsEditModalOpen(false);
          
          // Show success message
          setSuccessMessage('Book updated successfully!');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      } catch (err) {
        setError('Failed to update book');
        console.error('Error updating book:', err);
      }
    }
  };

  const handleDeleteBook = async () => {
    if (id) {
      try {
        const success = await deleteBook(id);
        
        if (success) {
          navigate('/books');
        } else {
          setIsDeleteModalOpen(false);
          setSuccessMessage('Cannot delete a borrowed book.');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      } catch (err) {
        setError('Failed to delete book');
        console.error('Error deleting book:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-500">Loading book details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-500">Book not found</p>
      </div>
    );
  }

  const isOverdue = book.status === 'Borrowed' && 
                    book.dueDate && 
                    new Date(book.dueDate) < new Date();

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        {/* Back navigation */}
        <div>
          <Link to="/books" className="flex items-center text-primary-600 hover:text-primary-800">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Books</span>
          </Link>
        </div>
        
        {/* Book header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-1">{book.title}</h1>
            <p className="text-xl text-gray-600">by {book.author}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-secondary flex items-center justify-center"
            >
              <Edit className="h-5 w-5 mr-2" />
              <span>Edit</span>
            </button>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-200 flex items-center justify-center"
            >
              <Trash className="h-5 w-5 mr-2" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setShowSuccess(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Book details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Book details */}
          <div className="md:col-span-2 card">
            <div className="flex items-center mb-6">
              <BookOpen className="h-6 w-6 mr-2 text-primary-600" />
              <h2 className="text-xl font-bold">Book Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-gray-600 mb-1">ISBN</p>
                <p className="text-lg">{book.isbn || 'Not available'}</p>
              </div>
              
              <div>
                <p className="text-gray-600 mb-1">Category</p>
                <p className="text-lg">{book.category}</p>
              </div>
              
              <div>
                <p className="text-gray-600 mb-1">Status</p>
                <p className="text-lg">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                    ${book.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : book.status === 'Borrowed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : book.status === 'Reserved'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'}`}
                  >
                    {book.status}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-gray-600 mb-1">Total Borrows</p>
                <p className="text-lg">{book.borrowCount}</p>
              </div>
              
              {book.status === 'Borrowed' && book.dueDate && (
                <div className="md:col-span-2">
                  <p className="text-gray-600 mb-1">Due Date</p>
                  <p className={`text-lg ${isOverdue ? 'text-accent-600 font-medium' : ''}`}>
                    {new Date(book.dueDate).toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Call to action buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              {book.status === 'Available' && (
                <Link 
                  to={`/circulation?bookId=${book.id}`}
                  className="btn btn-primary"
                >
                  Borrow This Book
                </Link>
              )}
              
              {book.status === 'Borrowed' && (
                <Link 
                  to={`/circulation?bookId=${book.id}&memberId=${book.borrowedByMemberId}`}
                  className="btn btn-primary"
                >
                  Return/Renew This Book
                </Link>
              )}
              
              <button className="btn btn-secondary flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                <span>View Borrow History</span>
              </button>
            </div>
          </div>
          
          {/* Borrower info or availability */}
          <div className="card">
            {book.status === 'Borrowed' && borrower ? (
              <>
                <div className="flex items-center mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                  <h2 className="text-xl font-bold">Current Borrower</h2>
                </div>
                
                <div className="space-y-3 mb-6">
                  <p className="text-xl font-medium">{borrower.name}</p>
                  <p><span className="text-gray-600">Phone:</span> {borrower.phone}</p>
                  <p><span className="text-gray-600">Apartment:</span> {borrower.apartmentNumber}</p>
                  {book.dueDate && (
                    <p>
                      <span className="text-gray-600">Due Date:</span> 
                      <span className={isOverdue ? 'text-accent-600 font-medium' : ''}>
                        {' '}{new Date(book.dueDate).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                </div>
                
                <Link 
                  to={`/members/${borrower.id}`}
                  className="btn btn-secondary w-full"
                >
                  View Member Details
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
                  <h2 className="text-xl font-bold">Availability</h2>
                </div>
                
                <div className="py-6 text-center">
                  {book.status === 'Available' ? (
                    <>
                      <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-xl font-medium text-green-600 mb-2">Available for Borrowing</p>
                      <p className="text-gray-600">This book can be borrowed immediately.</p>
                    </>
                  ) : book.status === 'Reserved' ? (
                    <>
                      <div className="inline-flex items-center justify-center p-4 bg-yellow-100 rounded-full mb-4">
                        <Calendar className="h-8 w-8 text-yellow-600" />
                      </div>
                      <p className="text-xl font-medium text-yellow-600 mb-2">Currently Reserved</p>
                      <p className="text-gray-600">This book is on hold for another member.</p>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-4">
                        <X className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-xl font-medium text-red-600 mb-2">Not Available</p>
                      <p className="text-gray-600">This book is currently not available.</p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Book Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateBook}>
                <div className="bg-white px-6 pt-5 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Edit Book</h3>
                    <button 
                      type="button" 
                      onClick={() => setIsEditModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
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
                        value={editedBook.title || ''}
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
                        value={editedBook.author || ''}
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
                        value={editedBook.isbn || ''}
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
                        value={editedBook.category || ''}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Children">Children's Books</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="status" className="block text-lg font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="input-field"
                        value={editedBook.status || ''}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Available">Available</option>
                        <option value="Borrowed">Borrowed</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                    
                    {book.status === 'Borrowed' && editedBook.status !== 'Borrowed' && (
                      <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
                        <p className="font-medium">
                          Warning: Changing status from 'Borrowed' will clear borrower information.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Book</h3>
                    <p className="text-lg text-gray-500">
                      Are you sure you want to delete this book? This action cannot be undone.
                    </p>
                    <p className="text-lg text-red-600 mt-2 font-medium">
                      Note: Books that are currently borrowed cannot be deleted.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBook}
                  className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail;