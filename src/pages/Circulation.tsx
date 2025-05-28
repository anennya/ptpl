import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, BookOpen, Users, ArrowRight, RotateCcw, Check, X, ArrowLeft } from 'lucide-react';
import { Book, Member } from '../types';
import { searchBooks, getBookById } from '../services/bookService';
import { searchMembers, getMemberById } from '../services/memberService';
import { borrowBook, returnBook, renewBook } from '../services/circulationService';

const Circulation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialBookId = searchParams.get('bookId');
  const initialMemberId = searchParams.get('memberId');
  
  const [step, setStep] = useState<'member' | 'book' | 'confirm'>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[] | Book[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [action, setAction] = useState<'borrow' | 'return' | 'renew'>('borrow');
  const [resultMessage, setResultMessage] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Handle direct navigation with book and member IDs
    const initializeFromParams = async () => {
      if (initialMemberId) {
        const member = getMemberById(initialMemberId);
        if (member) {
          setSelectedMember(member);
          setStep('book');
          
          if (initialBookId) {
            const book = getBookById(initialBookId);
            if (book) {
              setSelectedBook(book);
              if (book.status === 'Borrowed' && book.borrowedBy === initialMemberId) {
                setAction('return');
              }
              setStep('confirm');
            }
          }
        }
      } else if (initialBookId) {
        const book = getBookById(initialBookId);
        if (book) {
          setSelectedBook(book);
          if (book.status === 'Borrowed') {
            setAction('return');
          }
          setStep('member');
        }
      }
    };
    
    initializeFromParams();
  }, [initialBookId, initialMemberId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    if (step === 'member') {
      const members = searchMembers(searchQuery);
      setSearchResults(members);
    } else if (step === 'book') {
      let books = searchBooks(searchQuery);
      
      // If action is return, filter only books borrowed by the selected member
      if (action === 'return' && selectedMember) {
        books = books.filter(book => 
          book.status === 'Borrowed' && 
          book.borrowedBy === selectedMember.id
        );
      }
      
      setSearchResults(books);
    }
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setStep('book');
    setSearchQuery('');
    setSearchResults([]);
    
    // If the member has books to return, set action to return
    if (member.borrowedBooks.length > 0) {
      setAction('return');
    } else {
      setAction('borrow');
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setStep('confirm');
    
    // Set appropriate action based on book status
    if (book.status === 'Borrowed') {
      if (selectedMember && book.borrowedBy === selectedMember.id) {
        setAction('return');
      }
    } else {
      setAction('borrow');
    }
  };

  const handleConfirm = () => {
    if (!selectedMember || !selectedBook) return;
    
    let result;
    
    switch (action) {
      case 'borrow':
        result = borrowBook(selectedBook.id, selectedMember.id);
        break;
      case 'return':
        result = returnBook(selectedBook.id, selectedMember.id);
        break;
      case 'renew':
        result = renewBook(selectedBook.id, selectedMember.id);
        break;
    }
    
    setResultMessage({
      success: result.success,
      message: result.message,
    });
    
    // Reset if successful
    if (result.success) {
      setTimeout(() => {
        setSelectedMember(null);
        setSelectedBook(null);
        setStep('member');
        setSearchQuery('');
        setSearchResults([]);
        setResultMessage(null);
      }, 3000);
    }
  };

  const handleBackToMember = () => {
    setStep('member');
    setSelectedBook(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleBackToBook = () => {
    setStep('book');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSwitchAction = (newAction: 'borrow' | 'return' | 'renew') => {
    setAction(newAction);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderMemberStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Step 1: Select Member</h2>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => handleSwitchAction('borrow')}
            className={`btn ${action === 'borrow' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Borrow
          </button>
          <button 
            onClick={() => handleSwitchAction('return')}
            className={`btn ${action === 'return' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Return
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          placeholder="Search member by name, phone, or apartment..."
          className="input-field pl-10 w-full"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-4 h-6 w-6 text-gray-400" />
        <button type="submit" className="btn btn-primary absolute right-1 top-1">
          Search
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
      
      {searchQuery && searchResults.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-xl">No members found with that search.</p>
          <p className="mt-2">Try a different search term or <Link to="/members" className="text-primary-600 hover:text-primary-800">add a new member</Link>.</p>
        </div>
      )}
    </div>
  );

  const renderBookStep = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <h2 className="text-2xl font-bold">Step 2: Select Book</h2>
        
        <div className="flex space-x-3">
          {selectedMember && selectedMember.borrowedBooks.length > 0 && (
            <>
              <button 
                onClick={() => handleSwitchAction('borrow')}
                className={`btn ${action === 'borrow' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={selectedMember.borrowedBooks.length >= 2}
              >
                Borrow
              </button>
              <button 
                onClick={() => handleSwitchAction('return')}
                className={`btn ${action === 'return' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Return
              </button>
            </>
          )}
        </div>
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
            >
              Change Member
            </button>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          placeholder={action === 'return' 
            ? "Search book to return..." 
            : "Search book by title, author, or ISBN..."}
          className="input-field pl-10 w-full"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-4 h-6 w-6 text-gray-400" />
        <button type="submit" className="btn btn-primary absolute right-1 top-1">
          Search
        </button>
      </form>
      
      {action === 'return' && selectedMember && selectedMember.borrowedBooks.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-xl">This member has no books to return.</p>
          <button
            onClick={() => handleSwitchAction('borrow')}
            className="btn btn-primary mt-4"
          >
            Borrow a Book Instead
          </button>
        </div>
      )}
      
      {action === 'borrow' && selectedMember && selectedMember.borrowedBooks.length >= 2 && (
        <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
          <p className="font-medium">
            This member has already borrowed the maximum of 2 books.
          </p>
          <p className="mt-1">
            Please return a book before borrowing another one.
          </p>
          <button
            onClick={() => handleSwitchAction('return')}
            className="btn btn-accent mt-3"
          >
            Return a Book First
          </button>
        </div>
      )}
      
      {action === 'borrow' && selectedMember && selectedMember.fines > 0 && (
        <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
          <p className="font-medium">
            This member has unpaid fines of ₹{selectedMember.fines}.
          </p>
          <p className="mt-1">
            Please clear the fines before borrowing.
          </p>
          <Link
            to={`/members/${selectedMember.id}`}
            className="btn btn-accent mt-3"
          >
            View Member Details
          </Link>
        </div>
      )}
      
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full 
                    ${book.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : book.status === 'Borrowed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'}`}
                  >
                    {book.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchQuery && searchResults.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-xl">No books found with that search.</p>
          <p className="mt-2">Try a different search term or <Link to="/books" className="text-primary-600 hover:text-primary-800">add a new book</Link>.</p>
        </div>
      )}
      
      {action === 'return' && !searchQuery && selectedMember && selectedMember.borrowedBooks.length > 0 && (
        <>
          <h3 className="text-xl font-medium mt-4">Books to Return:</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {selectedMember.borrowedBooks.map(bookId => {
              const book = getBookById(bookId);
              if (!book) return null;
              
              return (
                <div 
                  key={book.id}
                  onClick={() => handleSelectBook(book)}
                  className="card hover:bg-primary-50 cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-primary-900">{book.title}</h3>
                      <p className="text-gray-600">{book.author}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {book.dueDate && `Due: ${new Date(book.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div>
                      <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                        Borrowed
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const renderConfirmStep = () => {
    if (!selectedMember || !selectedBook) return null;
    
    const isOverdue = selectedBook.status === 'Borrowed' && 
                      selectedBook.dueDate && 
                      new Date(selectedBook.dueDate) < new Date();
    
    const isRenewable = selectedBook.status === 'Borrowed' && 
                         selectedBook.borrowedBy === selectedMember.id;
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Step 3: Confirm {action.charAt(0).toUpperCase() + action.slice(1)}</h2>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <button
              onClick={handleBackToMember}
              className="btn btn-secondary"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Change Member
            </button>
            <button
              onClick={handleBackToBook}
              className="btn btn-secondary"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Change Book
            </button>
          </div>
          
          {isRenewable && (
            <div className="mt-3 md:mt-0">
              <button
                onClick={() => setAction(action === 'renew' ? 'return' : 'renew')}
                className={`btn ${action === 'renew' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                {action === 'renew' ? 'Confirming Renew' : 'Renew Instead'}
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center mb-3">
              <Users className="h-6 w-6 mr-2 text-primary-600" />
              <h3 className="text-xl font-bold">Member</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-medium">{selectedMember.name}</p>
              <p><span className="text-gray-600">Phone:</span> {selectedMember.phone}</p>
              <p><span className="text-gray-600">Apartment:</span> {selectedMember.apartmentNumber}</p>
              <p><span className="text-gray-600">Books Borrowed:</span> {selectedMember.borrowedBooks.length}/2</p>
              <p>
                <span className="text-gray-600">Fines:</span> 
                {selectedMember.fines > 0 
                  ? <span className="text-accent-600 font-medium"> ₹{selectedMember.fines}</span> 
                  : <span className="text-green-600"> None</span>}
              </p>
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
                <span className={`ml-1 px-2 py-0.5 text-sm font-semibold rounded-full 
                  ${selectedBook.status === 'Available' 
                    ? 'bg-green-100 text-green-800' 
                    : selectedBook.status === 'Borrowed' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'}`}
                >
                  {selectedBook.status}
                </span>
              </p>
              {selectedBook.dueDate && (
                <p>
                  <span className="text-gray-600">Due Date:</span> 
                  <span className={isOverdue ? 'text-accent-600 font-medium' : ''}>
                    {' '}{new Date(selectedBook.dueDate).toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Warning messages */}
        {action === 'borrow' && selectedMember.fines > 0 && (
          <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
            <p className="font-medium">
              Warning: This member has unpaid fines of ₹{selectedMember.fines}.
            </p>
            <p className="mt-1">
              It is recommended to clear the fines before borrowing.
            </p>
          </div>
        )}
        
        {action === 'borrow' && selectedMember.borrowedBooks.length >= 2 && (
          <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg">
            <p className="font-medium">
              This member has already borrowed the maximum of 2 books.
            </p>
            <p className="mt-1">
              Please return a book before borrowing another one.
            </p>
          </div>
        )}
        
        {action === 'return' && isOverdue && (
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
            disabled={(action === 'borrow' && selectedMember.borrowedBooks.length >= 2) || 
                     (action === 'return' && selectedBook.borrowedBy !== selectedMember.id)}
            className="btn btn-primary flex items-center"
          >
            <span>Confirm {action.charAt(0).toUpperCase() + action.slice(1)}</span>
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Circulation</h1>
          <p className="text-lg text-gray-600">Manage book borrowing, returns, and renewals.</p>
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
        
        {/* Main content */}
        <div className="card">
          {step === 'member' && renderMemberStep()}
          {step === 'book' && renderBookStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </div>
    </div>
  );
};

export default Circulation;