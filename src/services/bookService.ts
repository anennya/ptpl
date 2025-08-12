import { supabase } from "../lib/supabase";
import * as authService from "./auth";
import { Book } from "../types";

// Database interfaces
interface BookRow {
  id: string;
  title: string | null;
  author: string | null;
  category: string | null;
  isbn: string | null;
  book_number: string | null;
  language: string | null;
  price: string | null;
  publisher: string | null;
  available_quantity: string | null;
  currently_issued_to_mobile: string | null; // Phone number
  currently_issued_to_flat_number: string | null;
  book_added_by_name: string | null;
  book_added_by_id: string | null;
  book_donated_by: string | null;
  storage_location: string | null;
  cover_image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean | null;
  currently_issued_to: string | null; // Member ID (UUID)
}

interface LoanRow {
  id: string;
  book_id: string;
  due_on: string;
  returned_on: string | null;
  book: BookRow;
}



// Cast null to undefined for Book interface compatibility
const nullToUndefined = (value: string | null): string | undefined => {
  return value === null ? undefined : value;
};

// Get all books with due dates
export const getAllBooks = async (): Promise<Book[]> => {
  console.log("Fetching all books from Supabase...");
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("is_deleted", false)
    .order("title");

  if (error) {
    console.error("Error fetching books:", error);
    throw error;
  }

  console.log("Raw books data from Supabase:", data);

  // Get all active loans for due dates
  const { data: loans } = await supabase
    .from("loans")
    .select("book_id, due_on")
    .is("returned_on", null);

  const loansMap = new Map();
  loans?.forEach(loan => {
    loansMap.set(loan.book_id, new Date(loan.due_on));
  });

  // Get borrow count for all books
  const { data: borrowCounts } = await supabase
    .from("loans")
    .select("book_id")
    .not("book_id", "is", null);

  const borrowCountMap = new Map();
  borrowCounts?.forEach(loan => {
    const currentCount = borrowCountMap.get(loan.book_id) || 0;
    borrowCountMap.set(loan.book_id, currentCount + 1);
  });

  const transformedBooks: Book[] = data.map((book) => ({
    id: book.id,
    title: book.title || "",
    author: book.author || "",
    isbn: book.isbn || "",
    category: book.category || "Fiction",
    status: (parseInt(book.available_quantity || "0") > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(book.currently_issued_to_mobile), // Phone number
    borrowedByMemberId: nullToUndefined(book.currently_issued_to), // Member ID (UUID)
    dueDate: loansMap.get(book.id),
    borrowCount: borrowCountMap.get(book.id) || 0,
    coverUrl: nullToUndefined(book.cover_image_url),
  }));

  console.log("Transformed books:", transformedBooks);
  return transformedBooks;
};

// Get book by ID with due date from loans table
export const getBookById = async (id: string): Promise<Book | null> => {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching book:", error);
    return null;
  }

  // Get due date from loans table if book is borrowed
  let dueDate: Date | undefined;
  if (parseInt(data.available_quantity || "0") === 0 && data.currently_issued_to) {
    const { data: loanData } = await supabase
      .from("loans")
      .select("due_on")
      .eq("book_id", id)
      .eq("member_id", data.currently_issued_to)
      .is("returned_on", null)
      .single();
    
    if (loanData) {
      dueDate = new Date(loanData.due_on);
    }
  }

  // Get borrow count for this specific book
  const { data: borrowCountData } = await supabase
    .from("loans")
    .select("id")
    .eq("book_id", id);

  const borrowCount = borrowCountData?.length || 0;

  return {
    id: data.id,
    title: data.title || "",
    author: data.author || "",
    isbn: data.isbn || "",
    category: data.category || "Fiction",
    status: (parseInt(data.available_quantity || "0") > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(data.currently_issued_to_mobile), // Phone number
    borrowedByMemberId: nullToUndefined(data.currently_issued_to), // Member ID (UUID)
    dueDate: dueDate,
    borrowCount: borrowCount,
    coverUrl: nullToUndefined(data.cover_image_url),
  };
};

// Search books with due dates
export const searchBooks = async (query: string): Promise<Book[]> => {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("is_deleted", false)
    .or(`title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%`)
    .order("title");

  if (error) {
    console.error("Error searching books:", error);
    throw error;
  }

  // Get borrow counts for searched books
  const bookIds = data.map(book => book.id);
  const { data: borrowCounts } = await supabase
    .from("loans")
    .select("book_id")
    .in("book_id", bookIds);

  const borrowCountMap = new Map();
  borrowCounts?.forEach(loan => {
    const currentCount = borrowCountMap.get(loan.book_id) || 0;
    borrowCountMap.set(loan.book_id, currentCount + 1);
  });

  return data.map((book) => ({
    id: book.id,
    title: book.title || "",
    author: book.author || "",
    isbn: book.isbn || "",
    category: book.category || "Fiction",
    status: (parseInt(book.available_quantity || "0") > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(book.currently_issued_to_mobile),
    borrowedByMemberId: nullToUndefined(book.currently_issued_to),
    dueDate: undefined, // Would need additional query for this
    borrowCount: borrowCountMap.get(book.id) || 0,
    coverUrl: nullToUndefined(book.cover_image_url),
  }));
};

// Add new book
export const addBook = async (
  book: Omit<Book, "id" | "borrowCount">,
): Promise<Book | null> => {
  // Check permission first
  const hasPermission = await authService.canPerformAction("books", "create");

  if (!hasPermission) {
    throw new Error("Permission denied: Cannot create books");
  }

  // Get current user (admin) information from auth.users table
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("books")
    .insert([
      {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        book_number: book.bookNumber || null,
        language: book.language || 'English',
        price: book.price || null,
        publisher: book.publisher || null,
        available_quantity: "1",
        currently_issued_to_mobile: null,
        currently_issued_to_flat_number: null,
        book_added_by_name: user.email, // From auth.users table
        book_added_by_id: user.id, // From auth.users table
        book_donated_by: book.donatedBy || null,
        storage_location: book.storageLocation || null,
        cover_image_url: book.coverUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        currently_issued_to: null,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding book:", error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title || "",
    author: data.author || "",
    isbn: data.isbn || "",
    category: data.category || "Fiction",
    status: "Available" as Book['status'],
    borrowCount: 0,
    coverUrl: nullToUndefined(data.cover_image_url),
  };
};

// Update book
export const updateBook = async (updatedBook: Book): Promise<Book | null> => {
  // Check permission first
  const hasPermission = await authService.canPerformAction("books", "update");

  if (!hasPermission) {
    throw new Error("Permission denied: Cannot update books");
  }

  const { data, error } = await supabase
    .from("books")
    .update({
      title: updatedBook.title,
      author: updatedBook.author,
      isbn: updatedBook.isbn,
      category: updatedBook.category,
      available_quantity: updatedBook.status === "Available" ? 1 : 0,
      currently_issued_to: updatedBook.borrowedBy,
    })
    .eq("id", updatedBook.id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating book:", error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title || "",
    author: data.author || "",
    isbn: data.isbn || "",
    category: data.category || "Fiction",
    status: (parseInt(data.available_quantity || "0") > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(data.currently_issued_to_mobile), // Phone number
    borrowedByMemberId: nullToUndefined(data.currently_issued_to), // Member ID (UUID)
    borrowCount: 0,
    coverUrl: nullToUndefined(data.cover_image_url),
  };
};

// Delete book (soft delete)
export const deleteBook = async (id: string): Promise<boolean> => {
  // Check permission first
  const hasPermission = await authService.canPerformAction("books", "delete");

  if (!hasPermission) {
    throw new Error("Permission denied: Cannot delete books");
  }

  const { error } = await supabase
    .from("books")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) {
    console.error("Error deleting book:", error);
    throw error;
  }

  return true;
};

// Get books by category
export const getBooksByCategory = async (
  category: "Fiction" | "Non-Fiction" | "Children",
): Promise<Book[]> => {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("category", category)
    .eq("is_deleted", false)
    .order("title");

  if (error) {
    console.error("Error fetching books by category:", error);
    throw error;
  }

  return data.map((book): Book => ({
    id: book.id,
    title: book.title || "",
    author: book.author || "",
    isbn: book.isbn || "",
    category: book.category || "Fiction",
    status: (parseInt(book.available_quantity || "0") > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(book.currently_issued_to_mobile), // Phone number
    borrowedByMemberId: nullToUndefined(book.currently_issued_to), // Member ID (UUID)
    borrowCount: 0,
    coverUrl: nullToUndefined(book.cover_image_url),
  }));
};

// Get available books count
export const getAvailableBooksCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false)
    .gt("available_quantity", 0);

  if (error) {
    console.error("Error counting available books:", error);
    throw error;
  }

  return count || 0;
};

// Get borrowed books count
export const getBorrowedBooksCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false)
    .eq("available_quantity", 0);

  if (error) {
    console.error("Error counting borrowed books:", error);
    throw error;
  }

  return count || 0;
};

// Get overdue books
export const getOverdueBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from("loans")
    .select(
      `
      *,
      book:book_id (*)
    `,
    )
    .is("returned_on", null)
    .lt("due_on", new Date().toISOString());

  if (error) {
    console.error("Error fetching overdue books:", error);
    throw error;
  }

  return data.map((loan: LoanRow): Book => ({
    id: loan.book.id,
    title: loan.book.title || "",
    author: loan.book.author || "",
    isbn: loan.book.isbn || "",
    category: loan.book.category || "Fiction",
    status: "Borrowed" as Book['status'],
    borrowedBy: nullToUndefined(loan.book.currently_issued_to_mobile), // Phone number
    borrowedByMemberId: nullToUndefined(loan.book.currently_issued_to), // Member ID (UUID)
    dueDate: new Date(loan.due_on),
    borrowCount: 0,
    coverUrl: nullToUndefined(loan.book.cover_image_url),
  }));
};

// Get most popular books
export const getMostPopularBooks = async (
  limit: number = 5,
): Promise<Book[]> => {
  const { data, error } = await supabase
    .from("loans")
    .select("book_id, book:book_id (*)")
    .not("book_id", "is", null)
    .eq("book.is_deleted", false);

  if (error) {
    console.error("Error fetching popular books:", error);
    throw error;
  }

  if (!data) {
    return [];
  }

  // Count loans per book
  const bookCounts = data.reduce((acc: Record<string, number>, loan: unknown) => {
    if (loan && typeof loan === 'object' && 'book_id' in loan && typeof loan.book_id === 'string') {
      acc[loan.book_id] = (acc[loan.book_id] || 0) + 1;
    }
    return acc;
  }, {});

  // Create unique book list with borrow counts
  const uniqueBooksMap = new Map<string, unknown>();
  
  // First, collect unique books
  data.forEach((loan: unknown) => {
    if (loan && typeof loan === 'object' && 'book' in loan && loan.book && typeof loan.book === 'object' && 'id' in loan.book) {
      uniqueBooksMap.set(loan.book.id as string, loan.book);
    }
  });

  // Convert to array and transform to Book type
  const uniqueBooks: Book[] = Array.from(uniqueBooksMap.values())
    .map((book: unknown): Book => {
      if (!book || typeof book !== 'object') {
        throw new Error('Invalid book data');
      }
      
      const bookObj = book as Record<string, unknown>;
      
      return {
        id: String(bookObj.id || ''),
        title: String(bookObj.title || ''),
        author: String(bookObj.author || ''),
        isbn: String(bookObj.isbn || ''),
        category: String(bookObj.category || 'Fiction'),
        status: (Number(bookObj.available_quantity || 0) > 0 ? "Available" : "Borrowed") as Book['status'],
        borrowedBy: nullToUndefined(bookObj.currently_issued_to_mobile as string | null), // Phone number
        borrowedByMemberId: nullToUndefined(bookObj.currently_issued_to as string | null), // Member ID (UUID)
        borrowCount: bookCounts[String(bookObj.id || '')] || 0,
        coverUrl: nullToUndefined(bookObj.cover_image_url as string | null),
      };
    })
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, limit);

  return uniqueBooks;
};

// Add this function to the book service
export const getBookBorrowHistory = async (bookId: string): Promise<BorrowRecord[]> => {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      *,
      member:member_id (
        id,
        name,
        mobile_number
      )
    `)
    .eq('book_id', bookId)
    .order('issued_on', { ascending: false });
    
  if (error) {
    console.error('Error fetching book borrow history:', error);
    throw error;
  }
  
  return data.map(loan => ({
    id: loan.id,
    bookId: loan.book_id,
    memberId: loan.member_id,
    memberName: loan.member?.name || 'Unknown Member',
    memberPhone: loan.member?.mobile_number || '',
    borrowDate: new Date(loan.issued_on),
    dueDate: new Date(loan.due_on),
    returnDate: loan.returned_on ? new Date(loan.returned_on) : undefined,
    renewed: loan.is_renewed || false,
    fine: loan.fine_amount
  }));
};
