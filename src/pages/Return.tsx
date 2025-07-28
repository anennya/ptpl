import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Users, ArrowLeft, Check, X, Calendar } from 'lucide-react';
import { Book, Member } from '../types';
import { searchMembers, getMemberById } from '../services/memberService';
import { returnBook } from '../services/circulationService';
import { useAuth } from '../contexts/useAuth';
import { getBookById } from '../services/bookService';

const Return: React.FC = () => {
  const { user } = useAuth();
  
  const [step, setStep] = useState<'member' | 'books' | 'confirm'>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [resultMessage, setResultMessage] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const members = await searchMembers(searchQuery);
      setSearchResults(members);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member);
    setStep('books');
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    
    // Load the member's borrowed books with actual book details
    setIsLoading(true);
    try {
      const updatedMember = await getMemberById(member.id);
      if (updatedMember) {
        setSelectedMember(updatedMember);
        
        // Fetch actual book details for each borrowed book
        const bookPromises = updatedMember.borrowedBooks.map(bookId => getBookById(bookId));
        const books = await Promise.all(bookPromises);
        const validBooks = books.filter(book => book !== null) as Book[];
        setBorrowedBooks(validBooks);
      }
    } catch (err) {
      console.error('Error loading member details:', err);
      setError('Failed to load member details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBook = async (bookId: string) => {
    setIsLoading(true);
    try {
      // Fetch the actual book details instead of creating a placeholder
      const book = await getBookById(bookId);
      if (book) {
        setSelectedBook(book);
        setStep('confirm');
      } else {
        setError('Failed to load book details');
      }
    } catch (err) {
      console.error('Error loading book details:', err);
      setError('Failed to load book details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedMember || !selectedBook) return;
    
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await returnBook(selectedBook.id, selectedMember.id);
      
      setResultMessage({
        success: result.success,
        message: result.message,
      });
      
      if (result.success) {
        setTimeout(() => {
          setSelectedMember(null);
          setSelectedBook(null);
          setBorrowedBooks([]);
          setStep('member');
          setSearchQuery('');
          setSearchResults([]);
          setResultMessage(null);
          setHasSearched(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error performing action:', err);
      setError('Failed to complete action. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToMember = () => {
    setStep('member');
    setSelectedBook(null);
    setBorrowedBooks([]);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Return Books</h1>
          <p className="text-lg text-gray-600">Return books from library members.</p>
        </div>
        
        {/* Step indicators */}
        <div className="flex items-center justify-center">
          <div className="flex items-center w-full max-w-3xl justify-between">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'member' ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
              }`}>
                <Users className="h-5 w-5" />
              </div>
              <span className="mt-2 text-sm font-medium">Select Member</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${
              step === 'member' ? 'bg-gray-200' : 'bg-primary-200'
            }`}></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'books' ? 'bg-primary-600 text-white' : 
                step === 'confirm' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="mt-2 text-sm font-medium">Select Book</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${
              step === 'confirm' ? 'bg-primary-200' : 'bg-gray-200'
            }`}></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'confirm' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <Check className="h-5 w-5" />
              </div>
              <span className="mt-2 text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>
        
        {/* Success or error message */}
        {resultMessage && (
          <div className={`${
            resultMessage.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          } px-4 py-3 rounded-lg flex items-center justify-between`}>
            <div className="flex items-center">
              {resultMessage.success ? (
                <Check className="h-5 w-5 mr-2" />
              ) : (
                <X className="h-5 w-5 mr-2" />
              )}
              <span>{resultMessage.message}</span>
            </div>
            <button onClick={() => setResultMessage(null)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <X className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="card">
          {step === 'member' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Step 1: Select Member</h2>
              
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search member by name, phone, or apartment..."
                  className="input-field pl-10 w-full"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
              
              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      className="card hover:bg-primary-50 cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-primary-900">{member.name}</h3>
                          <p className="text-gray-600">{member.phone}</p>
                          <p className="text-gray-600">Apartment: {member.apartmentNumber}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-primary-100 text-primary-800">
                            {member.borrowedBooks.length}/2 Books
                          </span>
                          {member.fines > 0 && (
                            <span className="mt-2 px-3 py-1 text-sm font-semibold rounded-full bg-accent-100 text-accent-800">
                              ₹{member.fines} Fine
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {hasSearched && searchQuery && searchResults.length === 0 && !isLoading && (
                <div className="text-center py-10 text-gray-500">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-xl">No members found with that search.</p>
                  <p className="mt-2">Try a different search term or add a new member.</p>
                </div>
              )}
            </div>
          )}
          
          {step === 'books' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <h2 className="text-2xl font-bold">Step 2: Select Book to Return</h2>
              </div>
              
              <div className="bg-primary-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-6 w-6 mr-2 text-primary-600" />
                  <h3 className="text-lg font-bold">Selected Member:</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mt-2">
                  <div>
                    <p className="text-lg font-medium">{selectedMember?.name}</p>
                    <p className="text-gray-600">Phone: {selectedMember?.phone}</p>
                    <p className="text-gray-600">Apartment: {selectedMember?.apartmentNumber}</p>
                  </div>
                  <div className="flex space-x-3 mt-3 md:mt-0">
                    <button
                      onClick={handleBackToMember}
                      className="btn btn-secondary"
                      disabled={isLoading}
                    >
                      Change Member
                    </button>
                  </div>
                </div>
              </div>

              {/* Outstanding fines warning */}
              {selectedMember && selectedMember.fines > 0 && (
                <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">
                    This member has outstanding fines of ₹{selectedMember.fines}.
                  </p>
                  <p className="mt-1">
                    Consider collecting the fines when returning books.
                  </p>
                </div>
              )}
              
              {/* Borrowed books list */}
              {selectedMember && borrowedBooks.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Currently Borrowed Books:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {borrowedBooks.map(book => (
                      <div 
                        key={book.id}
                        onClick={() => handleSelectBook(book.id)}
                        className="card hover:bg-primary-50 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-primary-900">
                              {book.title}
                            </h3>
                            <p className="text-gray-600">{book.author}</p>
                            <div className="mt-1 flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                              <span className="text-sm text-gray-500">
                                {book.dueDate ? `Due: ${new Date(book.dueDate).toLocaleDateString()}` : 'Due: N/A'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                              Borrowed
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedMember && selectedMember.borrowedBooks.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-xl">This member has no books to return.</p>
                  <p className="mt-2">All books have been returned or there are no active loans.</p>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-xl">Loading borrowed books...</p>
                </div>
              )}
            </div>
          )}
          
          {step === 'confirm' && selectedMember && selectedBook && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Step 3: Confirm Return</h2>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <button
                    onClick={handleBackToMember}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Change Member
                  </button>
                  <button
                    onClick={() => setStep('books')}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Change Book
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <div className="flex items-center mb-3">
                    <Users className="h-6 w-6 mr-2 text-primary-600" />
                    <h3 className="text-xl font-bold">Member</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-medium">{selectedMember.name}</p>
                    <p><span className="text-gray-600">Phone:</span> {selectedMember.phone}</p>
                    <p><span className="text-gray-600">Apartment:</span> {selectedMember.apartmentNumber}</p>
                    <p>
                      <span className="text-gray-600">Books Borrowed:</span> 
                      <span className="ml-1 px-2 py-0.5 text-sm font-semibold rounded-full bg-primary-100 text-primary-800">
                        {selectedMember.borrowedBooks.length}/2
                      </span>
                    </p>
                    {selectedMember.fines > 0 && (
                      <p>
                        <span className="text-gray-600">Fines:</span> 
                        <span className="ml-1 text-accent-600 font-medium">₹{selectedMember.fines}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="card">
                  <div className="flex items-center mb-3">
                    <BookOpen className="h-6 w-6 mr-2 text-primary-600" />
                    <h3 className="text-xl font-bold">Book</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-medium">{selectedBook.title}</p>
                    <p><span className="text-gray-600">Author:</span> {selectedBook.author}</p>
                    <p><span className="text-gray-600">ISBN:</span> {selectedBook.isbn}</p>
                    <p><span className="text-gray-600">Category:</span> {selectedBook.category}</p>
                    <p>
                      <span className="text-gray-600">Status:</span> 
                      <span className="ml-1 px-2 py-0.5 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                        Borrowed
                      </span>
                    </p>
                    {selectedBook.dueDate && (
                      <p>
                        <span className="text-gray-600">Due Date:</span> 
                        <span className={new Date(selectedBook.dueDate) < new Date() ? 'text-accent-600 font-medium' : ''}>
                          {' '}{new Date(selectedBook.dueDate).toLocaleDateString()}
                          {new Date(selectedBook.dueDate) < new Date() && ' (Overdue)'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Warning messages */}
              {selectedBook.dueDate && new Date(selectedBook.dueDate) < new Date() && (
                <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">
                    This book is overdue. A fine will be calculated on return.
                  </p>
                  <p className="mt-1">
                    The fine is ₹5 per day overdue.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="btn btn-primary flex items-center"
                >
                  <span>
                    {isLoading 
                      ? 'Returning...' 
                      : 'Confirm Return'}
                  </span>
                  <ArrowLeft className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Return; 