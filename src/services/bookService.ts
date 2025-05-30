import { supabase } from "../lib/supabase";
import { authClient } from "../lib/auth-client";
import { Book } from "../types";

// Database interfaces
interface BookRow {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available_quantity: number;
  currently_issued_to: string | null;
  cover_image_url: string | null;
  is_deleted: boolean;
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

// Get all books
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

  const transformedBooks: Book[] = data.map((book) => ({
    id: book.id,
    title: book.title || "",
    author: book.author || "",
    isbn: book.isbn || "",
    category: book.category || "Fiction",
    status: (book.available_quantity > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(book.currently_issued_to),
    borrowCount: 0,
    coverUrl: nullToUndefined(book.cover_image_url),
  }));

  console.log("Transformed books:", transformedBooks);
  return transformedBooks;
};

// Get book by ID
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

  return {
    id: data.id,
    title: data.title || "",
    author: data.author || "",
    isbn: data.isbn || "",
    category: data.category || "Fiction",
    status: (data.available_quantity > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(data.currently_issued_to),
    borrowCount: 0,
    coverUrl: nullToUndefined(data.cover_image_url),
  };
};

// Search books
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

  return data.map((book): Book => ({
    id: book.id,
    title: book.title || "",
    author: book.author || "",
    isbn: book.isbn || "",
    category: book.category || "Fiction",
    status: (book.available_quantity > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(book.currently_issued_to),
    borrowCount: 0,
    coverUrl: nullToUndefined(book.cover_image_url),
  }));
};

// Add new book
export const addBook = async (
  book: Omit<Book, "id" | "borrowCount">,
): Promise<Book | null> => {
  // Check permission first
  const hasPermission = await authClient.organization.hasPermission({
    permissions: { books: ["create"] },
  });

  if (!hasPermission) {
    throw new Error("Permission denied: Cannot create books");
  }

  const { data, error } = await supabase
    .from("books")
    .insert([
      {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        available_quantity: 1,
        cover_image_url: book.coverUrl,
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
  const hasPermission = await authClient.organization.hasPermission({
    permissions: { books: ["update"] },
  });

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
    status: (data.available_quantity > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(data.currently_issued_to),
    borrowCount: 0,
    coverUrl: nullToUndefined(data.cover_image_url),
  };
};

// Delete book (soft delete)
export const deleteBook = async (id: string): Promise<boolean> => {
  // Check permission first
  const hasPermission = await authClient.organization.hasPermission({
    permissions: { books: ["delete"] },
  });

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
    status: (book.available_quantity > 0 ? "Available" : "Borrowed") as Book['status'],
    borrowedBy: nullToUndefined(book.currently_issued_to),
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
    borrowedBy: nullToUndefined(loan.book.currently_issued_to),
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
        borrowedBy: nullToUndefined(bookObj.currently_issued_to as string | null),
        borrowCount: bookCounts[String(bookObj.id || '')] || 0,
        coverUrl: nullToUndefined(bookObj.cover_image_url as string | null),
      };
    })
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, limit);

  return uniqueBooks;
};
