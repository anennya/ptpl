import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Users, ArrowRight, Check, X, ArrowLeft } from 'lucide-react';
import { Book, Member } from '../types';
import { searchBooks, getBookById } from '../services/bookService';
import { searchMembers, getMemberById } from '../services/memberService';
import { borrowBook } from '../services/circulationService';
import { useAuth } from '../contexts/useAuth';

const Borrow: React.FC = () => {
  const { user } = useAuth();
  
  const [step, setStep] = useState<'member' | 'book' | 'confirm'>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[] | Book[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
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
      if (step === 'member') {
        const members = await searchMembers(searchQuery);
        setSearchResults(members);
      } else if (step === 'book') {
        const books = await searchBooks(searchQuery);
        // Only show available books for borrowing
        const availableBooks = books.filter(book => book.status === 'Available');
        setSearchResults(availableBooks);
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setStep('book');
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setStep('confirm');
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
      const result = await borrowBook(selectedBook.id, selectedMember.id);
      
      setResultMessage({
        success: result.success,
        message: result.message,
      });
      
      if (result.success) {
        setTimeout(() => {
          setSelectedMember(null);
          setSelectedBook(null);
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
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleBackToBook = () => {
    setStep('book');
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Borrow Books</h1>
          <p className="text-lg text-gray-600">Issue books to library members.</p>
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
                step === 'book' ? 'bg-primary-600 text-white' : 
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <X className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <X className="h-5 w-5" />
            </button>
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
                  {(searchResults as Member[]).map(member => (
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
          
          {step === 'book' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <h2 className="text-2xl font-bold">Step 2: Select Book</h2>
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
              
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search book by title, author, or ISBN..."
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
              
              {selectedMember && selectedMember.borrowedBooks.length >= 2 && (
                <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">
                    This member has already borrowed the maximum of 2 books.
                  </p>
                  <p className="mt-1">
                    Please return a book before borrowing another one.
                  </p>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(searchResults as Book[]).map(book => (
                    <div 
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      className="card hover:bg-primary-50 cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-primary-900">{book.title}</h3>
                          <p className="text-gray-600">{book.author}</p>
                          <p className="text-sm text-gray-500 mt-1">ISBN: {book.isbn}</p>
                        </div>
                        <div>
                          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {hasSearched && searchQuery && searchResults.length === 0 && !isLoading && (
                <div className="text-center py-10 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-xl">No available books found with that search.</p>
                  <p className="mt-2">Try a different search term or add a new book.</p>
                </div>
              )}
            </div>
          )}
          
          {step === 'confirm' && selectedMember && selectedBook && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Step 3: Confirm Borrow</h2>
              
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
                    onClick={handleBackToBook}
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
                      <span className="ml-1 px-2 py-0.5 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                        Available
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Warning messages */}
              {selectedMember.fines > 0 && (
                <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">
                    Warning: This member has unpaid fines of ₹{selectedMember.fines}.
                  </p>
                  <p className="mt-1">
                    It is recommended to clear the fines before borrowing.
                  </p>
                </div>
              )}
              
              {selectedMember.borrowedBooks.length >= 2 && (
                <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">
                    This member has already borrowed the maximum of 2 books.
                  </p>
                  <p className="mt-1">
                    Please return a book before borrowing another one.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleConfirm}
                  disabled={
                    isLoading ||
                    selectedMember.borrowedBooks.length >= 2
                  }
                  className="btn btn-primary flex items-center"
                >
                  <span>
                    {isLoading 
                      ? 'Borrowing...' 
                      : 'Confirm Borrow'}
                  </span>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Borrow; 