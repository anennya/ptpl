import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash, BookOpen, Calendar, DollarSign, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Member, Book, BorrowRecord } from '../types';
import { getMemberById, updateMember, deleteMember, updateMemberFine } from '../services/memberService';
import { getBookById } from '../services/bookService';
import { getMemberBorrowHistory } from '../services/memberService';

const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<{record: BorrowRecord, book: Book}[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFineModalOpen, setIsFineModalOpen] = useState(false);
  const [editedMember, setEditedMember] = useState<Partial<Member>>({});
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadMemberData = async () => {
      if (id) {
        try {
          const memberData = await getMemberById(id);
          
          if (memberData) {
            setMember(memberData);
            setEditedMember({
              name: memberData.name,
              phone: memberData.phone,
              apartmentNumber: memberData.apartmentNumber,
            });
            
            // Get borrowed books details
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
            
            // Get borrow history
            const history = await getMemberBorrowHistory(id);
            const historyWithBooks = await Promise.all(
              history.map(async (record) => {
                const book = await getBookById(record.bookId);
                return { record, book: book! };
              })
            );
            
            setBorrowHistory(historyWithBooks.filter(item => item.book !== undefined));
          }
        } catch (error) {
          console.error('Error loading member data:', error);
        }
      }
    };
    
    loadMemberData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedMember(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (member && editedMember) {
      const updatedMember = {
        ...member,
        name: editedMember.name || member.name,
        phone: editedMember.phone || member.phone,
        apartmentNumber: editedMember.apartmentNumber || member.apartmentNumber,
      };
      
      updateMember(updatedMember);
      setMember(updatedMember);
      setIsEditModalOpen(false);
      
      // Show success message
      setSuccessMessage('Member updated successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDeleteMember = () => {
    if (id) {
      const success = deleteMember(id);
      
      if (success) {
        navigate('/members');
      } else {
        setIsDeleteModalOpen(false);
        setSuccessMessage('Cannot delete member with borrowed books.');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  };

  const handlePayFine = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (member && fineAmount > 0) {
      const updatedMember = updateMemberFine(member.id, fineAmount);
      
      if (updatedMember) {
        setMember(updatedMember);
        setIsFineModalOpen(false);
        setFineAmount(0);
        
        // Show success message
        setSuccessMessage(`Fine payment of ₹${fineAmount} recorded!`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  };

  const handleWaiveFine = () => {
    if (member) {
      const updatedMember = updateMemberFine(member.id, member.fines, true);
      
      if (updatedMember) {
        setMember(updatedMember);
        setIsFineModalOpen(false);
        
        // Show success message
        setSuccessMessage('All fines have been waived!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  };

  if (!member) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-500">Loading member details...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        {/* Back navigation */}
        <div>
          <Link to="/members" className="flex items-center text-primary-600 hover:text-primary-800">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Members</span>
          </Link>
        </div>
        
        {/* Member header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-1">{member.name}</h1>
            <div className="flex items-center space-x-4 text-lg text-gray-600">
              <span>{member.phone}</span>
              <span>•</span>
              <span>Apartment: {member.apartmentNumber}</span>
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
        
        {/* Member details and fines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Currently borrowed books */}
          <div className="md:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
                Currently Borrowed Books
              </h2>
              <span className="px-3 py-1 text-lg font-semibold rounded-full bg-primary-100 text-primary-800">
                {borrowedBooks.length}/2 Books
              </span>
            </div>
            
            {borrowedBooks.length > 0 ? (
              <div className="space-y-4">
                {borrowedBooks.map(book => (
                  <div key={book.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="mb-3 md:mb-0">
                      <Link to={`/books/${book.id}`} className="text-xl font-medium text-primary-700 hover:text-primary-900">
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
                    <div className="flex space-x-2">
                      <Link 
                        to={`/circulation?bookId=${book.id}&memberId=${member.id}`} 
                        className="btn bg-primary-50 text-primary-700 px-4 py-2 text-base"
                      >
                        Return
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg text-gray-500 py-6 text-center">No books currently borrowed.</p>
            )}
            
            <div className="mt-4">
              <Link 
                to={`/circulation?memberId=${member.id}`}
                className="btn btn-primary inline-flex items-center justify-center"
              >
                Borrow New Book
              </Link>
            </div>
          </div>
          
          {/* Fines panel */}
          <div className="card">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 mr-2 text-accent-500" />
              <h2 className="text-xl font-bold">Fines</h2>
            </div>
            
            <div className="text-center py-6">
              <div className={`text-4xl font-bold mb-4 ${member.fines > 0 ? 'text-accent-600' : 'text-green-600'}`}>
                ₹{member.fines}
              </div>
              <p className="text-lg text-gray-600 mb-6">
                {member.fines > 0 
                  ? 'This member has outstanding fines' 
                  : 'No outstanding fines'}
              </p>
              
              {member.fines > 0 && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setIsFineModalOpen(true)}
                    className="btn btn-accent w-full"
                  >
                    Record Payment
                  </button>
                  <button 
                    onClick={handleWaiveFine}
                    className="btn btn-secondary w-full"
                  >
                    Waive Fines
                  </button>
                </div>
              )}
            </div>
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
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-medium text-primary-700">{book.title}</div>
                        <div className="text-gray-600">{book.author}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                        {format(new Date(record.borrowDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                        {format(new Date(record.dueDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                        {record.returnDate 
                          ? format(new Date(record.returnDate), 'dd MMM yyyy')
                          : 'Not returned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.fine ? (
                          <span className="text-accent-600 font-medium">₹{record.fine}</span>
                        ) : (
                          <span className="text-green-600">No fine</span>
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateMember}>
                <div className="bg-white px-6 pt-5 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Edit Member</h3>
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
                      <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="input-field"
                        value={editedMember.name || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-lg font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        className="input-field"
                        value={editedMember.phone || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="apartmentNumber" className="block text-lg font-medium text-gray-700 mb-1">
                        Apartment Number
                      </label>
                      <input
                        type="text"
                        id="apartmentNumber"
                        name="apartmentNumber"
                        className="input-field"
                        value={editedMember.apartmentNumber || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Member</h3>
                    <p className="text-lg text-gray-500">
                      Are you sure you want to delete this member? This action cannot be undone.
                    </p>
                    <p className="text-lg text-red-600 mt-2 font-medium">
                      Note: Members with borrowed books cannot be deleted.
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
                  onClick={handleDeleteMember}
                  className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fine Payment Modal */}
      {isFineModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handlePayFine}>
                <div className="bg-white px-6 pt-5 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Record Fine Payment</h3>
                    <button 
                      type="button" 
                      onClick={() => setIsFineModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-lg text-gray-600 mb-4">
                      Total outstanding fine: <span className="font-bold text-accent-600">₹{member.fines}</span>
                    </p>
                    
                    <div>
                      <label htmlFor="fineAmount" className="block text-lg font-medium text-gray-700 mb-1">
                        Payment Amount (₹)
                      </label>
                      <input
                        type="number"
                        id="fineAmount"
                        name="fineAmount"
                        min="1"
                        max={member.fines}
                        className="input-field"
                        value={fineAmount || ''}
                        onChange={(e) => setFineAmount(parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Note: This will record the payment in the system. Actual payment is collected separately.
                  </p>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsFineModalOpen(false)}
                    className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-accent"
                    disabled={!fineAmount || fineAmount <= 0 || fineAmount > member.fines}
                  >
                    Record Payment
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

export default MemberDetail;