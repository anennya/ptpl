import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Users, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign,
  Check,
  X,
  BookOpen,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { Member, BorrowRecord, Book } from '../types';
import { getMemberById, updateMember, deleteMember, updateMemberFine, getMemberBorrowHistory } from '../services/memberService';
import { getBookById } from '../services/bookService';
import { Fine, addFine, getMemberFines, payFine, waiveFine } from '../services/finesService';

const ManageMemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<BorrowRecord[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFineModalOpen, setIsFineModalOpen] = useState(false);
  const [isAddFineModalOpen, setIsAddFineModalOpen] = useState(false);
  const [editedMember, setEditedMember] = useState<Partial<Member>>({});
  const [fineAmount, setFineAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Add fine modal state
  const [newFine, setNewFine] = useState({
    daysOverdue: '',
    fineAmount: '',
    bookId: '',
    reason: ''
  });

  useEffect(() => {
    if (id) {
      loadMemberData();
    }
  }, [id]);

  const loadMemberData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const memberData = await getMemberById(id);
      if (memberData) {
        setMember(memberData);
        setEditedMember({
          name: memberData.name,
          phone: memberData.phone,
          apartmentNumber: memberData.apartmentNumber,
        });
        
        // Load borrow history with book details
        const history = await getMemberBorrowHistory(id);
        
        // Fetch book details for each history record
        const historyWithBooks = await Promise.all(
          history.map(async (record) => {
            const book = await getBookById(record.bookId);
            return { record, book };
          })
        );
        
        setBorrowHistory(historyWithBooks);
        
        // Load currently borrowed books
        const books: Book[] = [];
        if (memberData.borrowedBooks && Array.isArray(memberData.borrowedBooks)) {
          for (const bookId of memberData.borrowedBooks) {
            const book = await getBookById(bookId);
            if (book) {
              books.push(book);
            }
          }
        }
        setBorrowedBooks(books);

        // Load fines
        const memberFines = await getMemberFines(id);
        setFines(memberFines);
      }
    } catch (err) {
      console.error('Error loading member:', err);
      setError('Failed to load member details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedMember(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!member || !editedMember) return;
    
    try {
      const updatedMember = {
        ...member,
        ...editedMember,
      };
      
      const result = await updateMember(updatedMember);
      if (result) {
        setMember(result);
        setIsEditModalOpen(false);
        
        setSuccessMessage('Member updated successfully!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating member:', err);
      setError('Failed to update member');
    }
  };

  const handleDeleteMember = async () => {
    if (!id) return;
    
    try {
      const success = await deleteMember(id);
      
      if (success) {
        // Navigate back to members list
        window.history.back();
      } else {
        setIsDeleteModalOpen(false);
        setSuccessMessage('Cannot delete a member with active loans.');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error deleting member:', err);
      setError('Failed to delete member');
    }
  };

  const handlePayFine = async (fineId: string) => {
    try {
      await payFine(fineId, 0); // Amount is already set in the fine
      setSuccessMessage('Fine payment recorded successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reload fines
      if (id) {
        const memberFines = await getMemberFines(id);
        setFines(memberFines);
      }
    } catch (err) {
      console.error('Error paying fine:', err);
      setError('Failed to record fine payment');
    }
  };

  const handleWaiveFine = async (fineId: string) => {
    try {
      await waiveFine(fineId, 'Waived by admin');
      setSuccessMessage('Fine waived successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reload fines
      if (id) {
        const memberFines = await getMemberFines(id);
        setFines(memberFines);
      }
    } catch (err) {
      console.error('Error waiving fine:', err);
      setError('Failed to waive fine');
    }
  };

  // Add fine functions
  const handleAddFine = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !newFine.fineAmount || !newFine.daysOverdue) return;
    
    try {
      await addFine({
        memberId: id,
        bookId: newFine.bookId || undefined,
        daysOverdue: parseInt(newFine.daysOverdue),
        fineAmount: parseFloat(newFine.fineAmount),
        isPaid: false,
        waived: false
      });
      
      setIsAddFineModalOpen(false);
      setNewFine({ daysOverdue: '', fineAmount: '', bookId: '', reason: '' });
      setSuccessMessage('Fine added successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reload fines
      const memberFines = await getMemberFines(id);
      setFines(memberFines);
    } catch (err) {
      console.error('Error adding fine:', err);
      setError('Failed to add fine');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-500">Loading member details...</p>
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

  if (!member) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-500">Member not found</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        {/* Back navigation */}
        <div>
          <Link to="/manage-members" className="flex items-center text-primary-600 hover:text-primary-800">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Manage Members</span>
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

        {/* Member header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-1">{member.name}</h1>
            <p className="text-lg text-gray-600">{member.phone} • Apartment {member.apartmentNumber}</p>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Joined {member.membershipDate ? format(new Date(member.membershipDate), 'dd MMM yyyy') : 'N/A'}</span>
            </div>
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

        {/* Member details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Currently borrowed books */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
                <h2 className="text-xl font-bold">Currently Borrowed Books</h2>
              </div>
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-primary-100 text-primary-800">
                {borrowedBooks.length}/2 Books
              </span>
            </div>
            
            {borrowedBooks.length > 0 ? (
              <div className="space-y-4">
                {borrowedBooks.map(book => (
                  <div key={book.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="mb-3 md:mb-0">
                      <Link to={`/manage-books/${book.id}`} className="text-xl font-medium text-primary-700 hover:text-primary-900">
                        {book.title}
                      </Link>
                      <p className="text-gray-600">{book.author}</p>
                      <div className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          Due: {book.dueDate ? format(new Date(book.dueDate), 'dd MMM yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg text-gray-500 py-6 text-center">No books currently borrowed.</p>
            )}
          </div>
          
          {/* Fines panel */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Fines</h3>
              <button
                onClick={() => setIsAddFineModalOpen(true)}
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Fine
              </button>
            </div>
            
            {fines.length > 0 ? (
              <div className="space-y-3">
                {fines.map(fine => (
                  <div key={fine.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        ₹{fine.fineAmount} - {fine.daysOverdue} days overdue
                      </div>
                      <div className="text-sm text-gray-500">
                        Recorded on {format(fine.recordedOn, 'dd MMM yyyy')}
                      </div>
                      {fine.waivedReason && (
                        <div className="text-sm text-gray-500">
                          Reason: {fine.waivedReason}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!fine.isPaid && !fine.waived && (
                        <>
                          <button
                            onClick={() => handlePayFine(fine.id)}
                            className="btn btn-sm btn-primary"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => handleWaiveFine(fine.id)}
                            className="btn btn-sm btn-secondary"
                          >
                            Waive
                          </button>
                        </>
                      )}
                      {fine.isPaid && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      )}
                      {fine.waived && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Waived
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No fines recorded</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Borrow History */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Calendar className="h-5 w-5 mr-2 text-primary-600" />
            <h2 className="text-xl font-bold">Borrowing History</h2>
          </div>
          
          {borrowHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                      Book
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
                  {borrowHistory.map(({ record, book }) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          to={`/manage-books/${record.bookId}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          {book ? book.title : `Book ${record.bookId.slice(0, 8)}`}
                        </Link>
                        {book && book.author && (
                          <div className="text-sm text-gray-500">{book.author}</div>
                        )}
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
            <p className="text-lg text-gray-500 py-6 text-center">No borrowing history available.</p>
          )}
        </div>
      </div>

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Member</h3>
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editedMember.name || ''}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editedMember.phone || ''}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apartment Number
                </label>
                <input
                  type="text"
                  name="apartmentNumber"
                  value={editedMember.apartmentNumber || ''}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                />
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

      {/* Delete Member Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete Member</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {member.name}? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="btn bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-200 flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Fine Payment Modal */}
      {isFineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Record Fine Payment</h3>
            <form onSubmit={handlePayFine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={member.fines}
                  value={fineAmount}
                  onChange={(e) => setFineAmount(e.target.value)}
                  className="input-field w-full"
                  placeholder={`0.00 (max: ₹${member.fines})`}
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFineModalOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent flex-1"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Fine Modal */}
      {isAddFineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add Fine</h3>
              <button
                onClick={() => setIsAddFineModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddFine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Overdue
                </label>
                <input
                  type="number"
                  min="1"
                  value={newFine.daysOverdue}
                  onChange={(e) => setNewFine(prev => ({ ...prev, daysOverdue: e.target.value }))}
                  className="input-field w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fine Amount (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newFine.fineAmount}
                  onChange={(e) => setNewFine(prev => ({ ...prev, fineAmount: e.target.value }))}
                  className="input-field w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book ID (Optional)
                </label>
                <input
                  type="text"
                  value={newFine.bookId}
                  onChange={(e) => setNewFine(prev => ({ ...prev, bookId: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Leave empty for general fine"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={newFine.reason}
                  onChange={(e) => setNewFine(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-field w-full"
                  rows={3}
                  placeholder="e.g., Late return, Damaged book"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddFineModalOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Add Fine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMemberDetail; 