import { Book, Member, BorrowRecord } from '../types';
import { getBookById, updateBook } from './bookService';
import { getMemberById, updateMember } from './memberService';

// Borrow a book
export const borrowBook = (
  bookId: string,
  memberId: string
): { success: boolean; message: string; record?: BorrowRecord } => {
  const book = getBookById(bookId);
  const member = getMemberById(memberId);
  
  // Validate book and member
  if (!book) return { success: false, message: 'Book not found' };
  if (!member) return { success: false, message: 'Member not found' };
  
  // Check if book is available
  if (book.status !== 'Available') {
    return { success: false, message: 'Book is not available for borrowing' };
  }
  
  // Check if member has fines
  if (member.fines > 0) {
    return { 
      success: false, 
      message: `Member has unpaid fines of ₹${member.fines}. Please clear fines before borrowing.` 
    };
  }
  
  // Check borrowing limit (2 books per member)
  if (member.borrowedBooks.length >= 2) {
    return { success: false, message: 'Member has reached the maximum borrowing limit (2 books)' };
  }
  
  // Create borrow record
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
  
  const borrowRecord: BorrowRecord = {
    id: Date.now().toString(),
    bookId,
    memberId,
    borrowDate,
    dueDate,
    renewed: false,
  };
  
  // Update book status
  const updatedBook: Book = {
    ...book,
    status: 'Borrowed',
    borrowedBy: memberId,
    dueDate,
    borrowCount: book.borrowCount + 1,
  };
  
  // Update member's borrowed books
  const updatedMember: Member = {
    ...member,
    borrowedBooks: [...member.borrowedBooks, bookId],
  };
  
  // Save borrow record
  const borrowRecords = localStorage.getItem('borrowRecords');
  const records: BorrowRecord[] = borrowRecords ? JSON.parse(borrowRecords) : [];
  localStorage.setItem('borrowRecords', JSON.stringify([...records, borrowRecord]));
  
  // Save updated book and member
  updateBook(updatedBook);
  updateMember(updatedMember);
  
  return { 
    success: true, 
    message: 'Book borrowed successfully', 
    record: borrowRecord 
  };
};

// Return a book
export const returnBook = (
  bookId: string,
  memberId: string
): { success: boolean; message: string; fine?: number } => {
  const book = getBookById(bookId);
  const member = getMemberById(memberId);
  
  // Validate book and member
  if (!book) return { success: false, message: 'Book not found' };
  if (!member) return { success: false, message: 'Member not found' };
  
  // Check if book is borrowed by this member
  if (book.status !== 'Borrowed' || book.borrowedBy !== memberId) {
    return { success: false, message: 'This book is not borrowed by this member' };
  }
  
  // Get borrow record
  const borrowRecords = localStorage.getItem('borrowRecords');
  
  if (!borrowRecords) {
    return { success: false, message: 'Borrow record not found' };
  }
  
  const records: BorrowRecord[] = JSON.parse(borrowRecords);
  const recordIndex = records.findIndex(
    record => record.bookId === bookId && record.memberId === memberId && !record.returnDate
  );
  
  if (recordIndex === -1) {
    return { success: false, message: 'Borrow record not found' };
  }
  
  const record = records[recordIndex];
  
  // Calculate fine if book is overdue (5 rupees per day)
  let fine = 0;
  const now = new Date();
  const dueDate = new Date(record.dueDate);
  
  if (now > dueDate) {
    const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    fine = overdueDays * 5; // 5 rupees per day
  }
  
  // Update borrow record
  const updatedRecord: BorrowRecord = {
    ...record,
    returnDate: now,
    fine: fine > 0 ? fine : undefined,
  };
  
  records[recordIndex] = updatedRecord;
  
  // Update book status
  const updatedBook: Book = {
    ...book,
    status: 'Available',
    borrowedBy: undefined,
    dueDate: undefined,
  };
  
  // Update member's borrowed books and fines
  const updatedMember: Member = {
    ...member,
    borrowedBooks: member.borrowedBooks.filter(id => id !== bookId),
    borrowHistory: [...member.borrowHistory, updatedRecord],
    fines: member.fines + fine,
  };
  
  // Save changes
  localStorage.setItem('borrowRecords', JSON.stringify(records));
  updateBook(updatedBook);
  updateMember(updatedMember);
  
  return { 
    success: true, 
    message: fine > 0 
      ? `Book returned successfully. Fine of ₹${fine} added.` 
      : 'Book returned successfully',
    fine: fine > 0 ? fine : undefined 
  };
};

// Renew a book
export const renewBook = (
  bookId: string,
  memberId: string
): { success: boolean; message: string; newDueDate?: Date } => {
  const book = getBookById(bookId);
  const member = getMemberById(memberId);
  
  // Validate book and member
  if (!book) return { success: false, message: 'Book not found' };
  if (!member) return { success: false, message: 'Member not found' };
  
  // Check if book is borrowed by this member
  if (book.status !== 'Borrowed' || book.borrowedBy !== memberId) {
    return { success: false, message: 'This book is not borrowed by this member' };
  }
  
  // Get borrow record
  const borrowRecords = localStorage.getItem('borrowRecords');
  
  if (!borrowRecords) {
    return { success: false, message: 'Borrow record not found' };
  }
  
  const records: BorrowRecord[] = JSON.parse(borrowRecords);
  const recordIndex = records.findIndex(
    record => record.bookId === bookId && record.memberId === memberId && !record.returnDate
  );
  
  if (recordIndex === -1) {
    return { success: false, message: 'Borrow record not found' };
  }
  
  const record = records[recordIndex];
  
  // Check if book is already renewed
  if (record.renewed) {
    return { success: false, message: 'This book has already been renewed once' };
  }
  
  // Calculate new due date (30 days from now)
  const newDueDate = new Date();
  newDueDate.setDate(newDueDate.getDate() + 30);
  
  // Update borrow record
  const updatedRecord: BorrowRecord = {
    ...record,
    dueDate: newDueDate,
    renewed: true,
  };
  
  records[recordIndex] = updatedRecord;
  
  // Update book due date
  const updatedBook: Book = {
    ...book,
    dueDate: newDueDate,
  };
  
  // Save changes
  localStorage.setItem('borrowRecords', JSON.stringify(records));
  updateBook(updatedBook);
  
  return { 
    success: true, 
    message: 'Book renewed successfully. New due date is in 30 days.',
    newDueDate 
  };
};

// Get all borrow records
export const getAllBorrowRecords = (): BorrowRecord[] => {
  const borrowRecords = localStorage.getItem('borrowRecords');
  return borrowRecords ? JSON.parse(borrowRecords) : [];
};

// Get active borrow records (not returned yet)
export const getActiveBorrowRecords = (): BorrowRecord[] => {
  const records = getAllBorrowRecords();
  return records.filter(record => !record.returnDate);
};

// Get overdue borrow records
export const getOverdueBorrowRecords = (): BorrowRecord[] => {
  const records = getActiveBorrowRecords();
  const now = new Date();
  
  return records.filter(record => new Date(record.dueDate) < now);
};