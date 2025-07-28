import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  BookOpen, 
  User, 
  Calendar, 
  Check,
  X,
  Activity
} from 'lucide-react';
import { Book, Member } from '../types';
import { getBookById, updateBook, deleteBook, getBookBorrowHistory } from '../services/bookService';
import { getMemberById } from '../services/memberService';
import { format } from 'date-fns';

const ManageBookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [borrower, setBorrower] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editedBook, setEditedBook] = useState<Partial<Book>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [borrowHistory, setBorrowHistory] = useState<BorrowRecord[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadBook();
    }
  }, [id]);

  const loadBook = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
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
  };

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
          updatedBook.borrowedByMemberId = undefined;
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
          navigate('/manage-books');
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

  const loadBorrowHistory = async () => {
    if (!id) return;
    
    try {
      const history = await getBookBorrowHistory(id);
      setBorrowHistory(history);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error('Error loading borrow history:', err);
      setError('Failed to load borrow history');
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
          <Link to="/manage-books" className="flex items-center text-primary-600 hover:text-primary-800">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Manage Books</span>
          </Link>
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

        {/* Book details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Book information */}
          <div className="card">
            <div className="flex items-center mb-4">
              <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
              <h2 className="text-xl font-bold">Book Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 font-medium">Title:</span>
                <p className="text-lg">{book.title}</p>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">Author:</span>
                <p className="text-lg">{book.author}</p>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">ISBN:</span>
                <p className="text-lg">{book.isbn}</p>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">Category:</span>
                <p className="text-lg">{book.category}</p>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">Status:</span>
                <div className="mt-1">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    book.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : book.status === 'Borrowed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {book.status}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">Times Borrowed:</span>
                <p className="text-lg">{book.borrowCount}</p>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <button 
                onClick={loadBorrowHistory}
                className="btn btn-secondary flex items-center"
              >
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
                  <User className="h-5 w-5 mr-2 text-primary-600" />
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
                        {isOverdue && ' (Overdue)'}
                      </span>
                    </p>
                  )}
                </div>
                
                <Link 
                  to={`/manage-members/${borrower.id}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Book</h3>
            <form onSubmit={handleUpdateBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={editedBook.title || ''}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  name="author"
                  value={editedBook.author || ''}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ISBN
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={editedBook.isbn || ''}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={editedBook.category || ''}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Children">Children</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={editedBook.status || ''}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Available">Available</option>
                  <option value="Borrowed">Borrowed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Book Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete Book</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{book.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBook}
                className="btn bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-200 flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Borrow History for {book?.title}</h3>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {borrowHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                        Member
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                        Borrowed On
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                        Returned On
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                        Fine
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {borrowHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            to={`/manage-members/${record.memberId}`}
                            className="text-primary-600 hover:text-primary-900 font-medium"
                          >
                            Member {record.memberId.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {format(record.borrowDate, 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {format(record.dueDate, 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {record.returnDate ? format(record.returnDate, 'dd MMM yyyy') : 'Not returned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.fine ? (
                            <span className="px-2 py-1 text-sm font-semibold rounded-full bg-accent-100 text-accent-800">
                              ₹{record.fine}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-lg text-gray-500 py-6 text-center">No borrow history available for this book.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookDetail; 