import { supabase } from '../lib/supabase';
import { Book, Member, BorrowRecord } from '../types';
import { getBookById, updateBook } from './bookService';
import { getMemberById, updateMember } from './memberService';

// Borrow a book
export const borrowBook = async (
  bookId: string,
  memberId: string,
  issuedById: string
): Promise<{ success: boolean; message: string; record?: BorrowRecord }> => {
  const book = await getBookById(bookId);
  const member = await getMemberById(memberId);
  
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
  
  // Create loan record in Supabase
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
  
  try {
    // Create loan record
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .insert({
        book_id: bookId,
        member_id: memberId,
        issued_on: borrowDate.toISOString(),
        due_on: dueDate.toISOString(),
        is_renewed: false,
        issued_by: issuedById
      })
      .select()
      .single();

    if (loanError) {
      console.error('Error creating loan:', loanError);
      return { success: false, message: 'Failed to create loan record' };
    }

    // Update book status
    const { error: bookError } = await supabase
      .from('books')
      .update({
        available_quantity: 0,
        currently_issued_to: member.phone // Using phone as identifier
      })
      .eq('id', bookId);

    if (bookError) {
      console.error('Error updating book:', bookError);
      // Rollback loan creation
      await supabase.from('loans').delete().eq('id', loanData.id);
      return { success: false, message: 'Failed to update book status' };
    }

    // Create borrow record for return value
    const borrowRecord: BorrowRecord = {
      id: loanData.id,
      bookId,
      memberId,
      borrowDate,
      dueDate,
      renewed: false,
    };
    
    return { 
      success: true, 
      message: 'Book borrowed successfully', 
      record: borrowRecord 
    };
  } catch (error) {
    console.error('Error in borrowBook:', error);
    return { success: false, message: 'An error occurred while borrowing the book' };
  }
};

// Return a book
export const returnBook = async (
  bookId: string,
  memberId: string,
  returnedById?: string
): Promise<{ success: boolean; message: string; fine?: number }> => {
  const book = await getBookById(bookId);
  const member = await getMemberById(memberId);
  
  // Validate book and member
  if (!book) return { success: false, message: 'Book not found' };
  if (!member) return { success: false, message: 'Member not found' };
  
  // Check if book is borrowed by this member
  if (book.status !== 'Borrowed' || book.borrowedBy !== memberId) {
    return { success: false, message: 'This book is not borrowed by this member' };
  }
  
  try {
    // Get the active loan record
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('book_id', bookId)
      .eq('member_id', memberId)
      .is('returned_on', null)
      .single();

    if (loanError || !loanData) {
      return { success: false, message: 'Loan record not found' };
    }

    // Calculate fine if book is overdue (5 rupees per day)
    let fine = 0;
    const now = new Date();
    const dueDate = new Date(loanData.due_on);
    
    if (now > dueDate) {
      const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fine = overdueDays * 5; // 5 rupees per day
    }

    // Update loan record with return date
    const { error: updateLoanError } = await supabase
      .from('loans')
      .update({
        returned_on: now.toISOString()
      })
      .eq('id', loanData.id);

    if (updateLoanError) {
      console.error('Error updating loan:', updateLoanError);
      return { success: false, message: 'Failed to update loan record' };
    }

    // Update book status
    const { error: bookError } = await supabase
      .from('books')
      .update({
        available_quantity: 1,
        currently_issued_to: null
      })
      .eq('id', bookId);

    if (bookError) {
      console.error('Error updating book:', bookError);
      return { success: false, message: 'Failed to update book status' };
    }

    // Update member's fines if there's a fine
    if (fine > 0) {
      const { error: fineError } = await supabase
        .from('members')
        .update({
          total_amount_due: member.fines + fine
        })
        .eq('id', memberId);

      if (fineError) {
        console.error('Error updating member fines:', fineError);
        // Don't fail the return, just log the error
      }
    }

    return { 
      success: true, 
      message: fine > 0 
        ? `Book returned successfully. Fine of ₹${fine} added.` 
        : 'Book returned successfully',
      fine: fine > 0 ? fine : undefined 
    };
  } catch (error) {
    console.error('Error in returnBook:', error);
    return { success: false, message: 'An error occurred while returning the book' };
  }
};

// Renew a book
export const renewBook = async (
  bookId: string,
  memberId: string,
  renewedById?: string
): Promise<{ success: boolean; message: string; newDueDate?: Date }> => {
  const book = await getBookById(bookId);
  const member = await getMemberById(memberId);
  
  // Validate book and member
  if (!book) return { success: false, message: 'Book not found' };
  if (!member) return { success: false, message: 'Member not found' };
  
  // Check if book is borrowed by this member
  if (book.status !== 'Borrowed' || book.borrowedBy !== memberId) {
    return { success: false, message: 'This book is not borrowed by this member' };
  }
  
  try {
    // Get the active loan record
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('book_id', bookId)
      .eq('member_id', memberId)
      .is('returned_on', null)
      .single();

    if (loanError || !loanData) {
      return { success: false, message: 'Loan record not found' };
    }

    // Check if book is already renewed
    if (loanData.is_renewed) {
      return { success: false, message: 'This book has already been renewed once' };
    }
    
    // Calculate new due date (30 days from now)
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 30);
    
    // Update loan record
    const { error: updateError } = await supabase
      .from('loans')
      .update({
        due_on: newDueDate.toISOString(),
        is_renewed: true
      })
      .eq('id', loanData.id);

    if (updateError) {
      console.error('Error updating loan:', updateError);
      return { success: false, message: 'Failed to renew book' };
    }
    
    return { 
      success: true, 
      message: 'Book renewed successfully. New due date is in 30 days.',
      newDueDate 
    };
  } catch (error) {
    console.error('Error in renewBook:', error);
    return { success: false, message: 'An error occurred while renewing the book' };
  }
};

// Get all borrow records (from Supabase)
export const getAllBorrowRecords = async (): Promise<BorrowRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('issued_on', { ascending: false });

    if (error) {
      console.error('Error fetching borrow records:', error);
      return [];
    }

    return data.map(loan => ({
      id: loan.id,
      bookId: loan.book_id,
      memberId: loan.member_id,
      borrowDate: new Date(loan.issued_on),
      dueDate: new Date(loan.due_on),
      returnDate: loan.returned_on ? new Date(loan.returned_on) : undefined,
      renewed: loan.is_renewed || false,
    }));
  } catch (error) {
    console.error('Error in getAllBorrowRecords:', error);
    return [];
  }
};

// Get active borrow records (not returned yet)
export const getActiveBorrowRecords = async (): Promise<BorrowRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .is('returned_on', null)
      .order('issued_on', { ascending: false });

    if (error) {
      console.error('Error fetching active borrow records:', error);
      return [];
    }

    return data.map(loan => ({
      id: loan.id,
      bookId: loan.book_id,
      memberId: loan.member_id,
      borrowDate: new Date(loan.issued_on),
      dueDate: new Date(loan.due_on),
      renewed: loan.is_renewed || false,
    }));
  } catch (error) {
    console.error('Error in getActiveBorrowRecords:', error);
    return [];
  }
};

// Get overdue borrow records
export const getOverdueBorrowRecords = async (): Promise<BorrowRecord[]> => {
  try {
    const now = new Date();
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .is('returned_on', null)
      .lt('due_on', now.toISOString())
      .order('due_on', { ascending: true });

    if (error) {
      console.error('Error fetching overdue borrow records:', error);
      return [];
    }

    return data.map(loan => ({
      id: loan.id,
      bookId: loan.book_id,
      memberId: loan.member_id,
      borrowDate: new Date(loan.issued_on),
      dueDate: new Date(loan.due_on),
      renewed: loan.is_renewed || false,
    }));
  } catch (error) {
    console.error('Error in getOverdueBorrowRecords:', error);
    return [];
  }
};