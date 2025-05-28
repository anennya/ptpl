import { Book } from '../types';

// Get all books
export const getAllBooks = (): Book[] => {
  const books = localStorage.getItem('books');
  return books ? JSON.parse(books) : [];
};

// Get book by ID
export const getBookById = (id: string): Book | null => {
  const books = getAllBooks();
  return books.find(book => book.id === id) || null;
};

// Search books by title, author, or ISBN
export const searchBooks = (query: string): Book[] => {
  const books = getAllBooks();
  const lowercaseQuery = query.toLowerCase();
  
  return books.filter(
    book =>
      book.title.toLowerCase().includes(lowercaseQuery) ||
      book.author.toLowerCase().includes(lowercaseQuery) ||
      book.isbn.includes(query)
  );
};

// Add new book
export const addBook = (book: Omit<Book, 'id' | 'borrowCount'>): Book => {
  const books = getAllBooks();
  
  const newBook: Book = {
    id: Date.now().toString(),
    ...book,
    borrowCount: 0,
  };
  
  localStorage.setItem('books', JSON.stringify([...books, newBook]));
  
  return newBook;
};

// Update book
export const updateBook = (updatedBook: Book): Book => {
  const books = getAllBooks();
  const updatedBooks = books.map(book => 
    book.id === updatedBook.id ? updatedBook : book
  );
  
  localStorage.setItem('books', JSON.stringify(updatedBooks));
  
  return updatedBook;
};

// Delete book
export const deleteBook = (id: string): boolean => {
  const books = getAllBooks();
  const book = getBookById(id);
  
  if (!book) return false;
  
  // Check if book is borrowed
  if (book.status === 'Borrowed') {
    return false;
  }
  
  const updatedBooks = books.filter(book => book.id !== id);
  localStorage.setItem('books', JSON.stringify(updatedBooks));
  
  return true;
};

// Get books by category
export const getBooksByCategory = (category: 'Fiction' | 'Non-Fiction' | 'Children'): Book[] => {
  const books = getAllBooks();
  return books.filter(book => book.category === category);
};

// Get available books count
export const getAvailableBooksCount = (): number => {
  const books = getAllBooks();
  return books.filter(book => book.status === 'Available').length;
};

// Get borrowed books count
export const getBorrowedBooksCount = (): number => {
  const books = getAllBooks();
  return books.filter(book => book.status === 'Borrowed').length;
};

// Get overdue books
export const getOverdueBooks = (): Book[] => {
  const books = getAllBooks();
  const now = new Date();
  
  return books.filter(book => 
    book.status === 'Borrowed' && 
    book.dueDate && 
    new Date(book.dueDate) < now
  );
};

// Get most popular books
export const getMostPopularBooks = (limit: number = 5): Book[] => {
  const books = getAllBooks();
  
  return [...books]
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, limit);
};