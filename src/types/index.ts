// Member types
export interface Member {
  id: string;
  name: string;
  phone: string;
  apartmentNumber: string;
  borrowedBooks: string[];
  borrowHistory: BorrowRecord[];
  fines: number;
}

// Book types
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string; // Changed from enum to string to match database
  status: 'Available' | 'Borrowed' | 'Reserved' | 'Lost';
  borrowedBy?: string; // Phone number (for backward compatibility)
  borrowedByMemberId?: string; // Member ID (UUID) - new field
  dueDate?: Date;
  borrowCount: number;
  coverUrl?: string;
}

// Circulation types
export interface BorrowRecord {
  id: string;
  bookId: string;
  memberId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  renewed: boolean;
  fine?: number;
}

// Dashboard types
export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  totalMembers: number;
  activeBorrowers: number;
  totalFines: number;
}

// Reports types
export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'monthly' | 'popular' | 'overdue' | 'defaulters' | 'category';
  data: any[];
}