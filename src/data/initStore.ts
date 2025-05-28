import { Member, Book, BorrowRecord, Report } from '../types';

// Initialize localStorage if it's empty
const initializeStore = () => {
  // Check if store is already initialized
  if (localStorage.getItem('storeInitialized')) return;
  
  // Sample Members
  const members: Member[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      apartmentNumber: 'A-101',
      borrowedBooks: ['1', '3'],
      borrowHistory: [],
      fines: 0,
    },
    {
      id: '2',
      name: 'Meena Sharma',
      phone: '9876543211',
      apartmentNumber: 'B-205',
      borrowedBooks: [],
      borrowHistory: [],
      fines: 0,
    },
    {
      id: '3',
      name: 'Prakash Verma',
      phone: '9876543212',
      apartmentNumber: 'C-308',
      borrowedBooks: ['2'],
      borrowHistory: [],
      fines: 25, // 5 days overdue
    },
    {
      id: '4',
      name: 'Sunita Patel',
      phone: '9876543213',
      apartmentNumber: 'A-402',
      borrowedBooks: [],
      borrowHistory: [],
      fines: 0,
    },
    {
      id: '5',
      name: 'Vijay Singh',
      phone: '9876543214',
      apartmentNumber: 'D-112',
      borrowedBooks: [],
      borrowHistory: [],
      fines: 15, // 3 days overdue
    },
  ];
  
  // Sample Books with cover images
  const books: Book[] = [
    {
      id: '1',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780061120084',
      category: 'Fiction',
      status: 'Borrowed',
      borrowedBy: '1',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      borrowCount: 42,
      coverUrl: 'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg'
    },
    {
      id: '2',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      category: 'Non-Fiction',
      status: 'Borrowed',
      borrowedBy: '3',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
      borrowCount: 28,
      coverUrl: 'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg'
    },
    {
      id: '3',
      title: 'Harry Potter and the Philosopher\'s Stone',
      author: 'J.K. Rowling',
      isbn: '9780747532743',
      category: 'Fiction',
      status: 'Borrowed',
      borrowedBy: '1',
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      borrowCount: 56,
      coverUrl: 'https://images.pexels.com/photos/3646105/pexels-photo-3646105.jpeg'
    },
    {
      id: '4',
      title: 'The Cat in the Hat',
      author: 'Dr. Seuss',
      isbn: '9780007158447',
      category: 'Children',
      status: 'Available',
      borrowCount: 67,
      coverUrl: 'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg'
    },
    {
      id: '5',
      title: 'The Power of Habit',
      author: 'Charles Duhigg',
      isbn: '9780812981605',
      category: 'Non-Fiction',
      status: 'Available',
      borrowCount: 31,
      coverUrl: 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg'
    },
    {
      id: '6',
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      isbn: '9780062315007',
      category: 'Fiction',
      status: 'Available',
      borrowCount: 49,
      coverUrl: 'https://images.pexels.com/photos/4245826/pexels-photo-4245826.jpeg'
    },
  ];
  
  // Sample Borrow Records
  const borrowRecords: BorrowRecord[] = [
    {
      id: '1',
      bookId: '1',
      memberId: '1',
      borrowDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      renewed: false,
    },
    {
      id: '2',
      bookId: '2',
      memberId: '3',
      borrowDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
      renewed: false,
      fine: 25, // 5 days * 5 rupees
    },
    {
      id: '3',
      bookId: '3',
      memberId: '1',
      borrowDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      renewed: true,
    },
    {
      id: '4',
      bookId: '5',
      memberId: '5',
      borrowDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days overdue
      returnDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // returned 12 days ago
      renewed: false,
      fine: 15, // 3 days * 5 rupees (partially paid)
    },
  ];
  
  // Sample Reports
  const reports: Report[] = [
    {
      id: '1',
      name: 'Monthly Circulation Report',
      description: 'Books issued and returned in the current month',
      type: 'monthly',
      data: [],
    },
    {
      id: '2',
      name: 'Popular Books Report',
      description: 'Most borrowed books in the library',
      type: 'popular',
      data: [],
    },
    {
      id: '3',
      name: 'Overdue Books Report',
      description: 'Currently overdue books and their borrowers',
      type: 'overdue',
      data: [],
    },
    {
      id: '4',
      name: 'Defaulters Report',
      description: 'Members with the most overdue instances',
      type: 'defaulters',
      data: [],
    },
    {
      id: '5',
      name: 'Category Popularity Report',
      description: 'Borrowing trends by book category',
      type: 'category',
      data: [],
    },
  ];
  
  // Store data in localStorage
  localStorage.setItem('members', JSON.stringify(members));
  localStorage.setItem('books', JSON.stringify(books));
  localStorage.setItem('borrowRecords', JSON.stringify(borrowRecords));
  localStorage.setItem('reports', JSON.stringify(reports));
  localStorage.setItem('storeInitialized', 'true');
};

// Run initialization
initializeStore();

export default initializeStore;