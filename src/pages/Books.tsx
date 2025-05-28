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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBooks();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewBook(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const coverUrl = newBook.coverUrl || 'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg';
      
      const result = await addBook({
        ...newBook,
        coverUrl,
        status: 'Available',
      });

      if (result) {
        setNewBook({
          title: '',
          author: '',
          isbn: '',
          category: 'Fiction',
          coverUrl: '',
        });
        setIsAddModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        loadBooks();
      } else {
        setError('Failed to add book. Please try again.');
      }
    } catch (err) {
      setError('Failed to add book. Please try again.');
      console.error('Error adding book:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleISBNDetected = async (isbn: string) => {
    setIsScannerActive(false);
    setIsLoading(true);
    setScannerError(null);

    try {
      const bookData = await fetchBookByISBN(isbn);
      if (bookData) {
        setNewBook(prev => ({
          ...prev,
          ...bookData,
        }));
      } else {
        setScannerError('Could not find book information. Please enter details manually.');
      }
    } catch (error) {
      setScannerError('Failed to fetch book information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScannerError = (error: string) => {
    setScannerError(error);
    setIsScannerActive(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Borrowed':
        return 'bg-blue-100 text-blue-800';
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  // Rest of the component remains the same...
  // (Previous render methods for grid view, list view, and modals)
  
  return (
    <div className="fade-in">
      {/* Previous JSX remains the same */}
    </div>
  );
};

export default Books;