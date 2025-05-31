import { Report, Book } from '../types';
import { getAllMembers } from './memberService';
import { getAllBorrowRecords } from './circulationService';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Import getAllBooks with a type annotation to handle Promise
import { getAllBooks as getBooks } from './bookService';

// Create a local wrapper function to handle the Promise
const getAllBooks = async (): Promise<Book[]> => {
  try {
    return await getBooks();
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
};

// Define interfaces for report data types
interface DailyBreakdown {
  date: string;
  borrowed: number;
  returned: number;
}

interface MonthlyReportItem {
  name: string;
  value: number | DailyBreakdown[];
}

interface BookReportItem {
  id: string;
  title: string;
  author: string;
  category: string;
  borrowCount: number;
}

interface OverdueReportItem {
  bookId: string;
  title: string;
  author: string;
  memberName: string;
  memberApartment: string;
  daysOverdue: number;
  fine: number;
}

interface DefaulterReportItem {
  memberId: string;
  name: string;
  apartment: string;
  overdueCount: number;
  totalFines: number;
}

interface CategoryReportItem {
  name: string;
  count: number;
}

// Union type for all report item types
type ReportItem = 
  | MonthlyReportItem 
  | BookReportItem 
  | OverdueReportItem 
  | DefaulterReportItem 
  | CategoryReportItem;

// Generate monthly circulation report
export const generateMonthlyReport = async (): Promise<MonthlyReportItem[]> => {
  const records = getAllBorrowRecords();
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
  
  // Filter records for the current month
  const monthlyRecords = records.filter(record => {
    const borrowDate = new Date(record.borrowDate);
    return borrowDate >= startDate && borrowDate <= endDate;
  });
  
  // Books borrowed this month
  const borrowed = monthlyRecords.length;
  
  // Books returned this month
  const returned = monthlyRecords.filter(record => record.returnDate).length;
  
  // Daily breakdown
  const dailyData: Record<string, { borrowed: number; returned: number }> = {};
  
  monthlyRecords.forEach(record => {
    const borrowDate = record.borrowDate instanceof Date 
      ? record.borrowDate 
      : new Date(record.borrowDate);
    
    const borrowDay = format(borrowDate, 'yyyy-MM-dd');
    
    if (!dailyData[borrowDay]) {
      dailyData[borrowDay] = { borrowed: 0, returned: 0 };
    }
    
    dailyData[borrowDay].borrowed += 1;
    
    if (record.returnDate) {
      const returnDate = record.returnDate instanceof Date 
        ? record.returnDate 
        : new Date(record.returnDate);
      
      const returnDay = format(returnDate, 'yyyy-MM-dd');
      
      if (!dailyData[returnDay]) {
        dailyData[returnDay] = { borrowed: 0, returned: 0 };
      }
      
      dailyData[returnDay].returned += 1;
    }
  });
  
  // Convert to array format for charts
  const dailyBreakdown: DailyBreakdown[] = Object.entries(dailyData).map(([date, data]) => ({
    date,
    borrowed: data.borrowed,
    returned: data.returned,
  }));
  
  return [
    { name: 'Total Borrowed', value: borrowed },
    { name: 'Total Returned', value: returned },
    { name: 'Daily Breakdown', value: dailyBreakdown },
  ];
};

// Generate popular books report
export const generatePopularBooksReport = async (): Promise<BookReportItem[]> => {
  const books = await getAllBooks();
  
  // Sort books by borrow count (descending)
  const sortedBooks = [...books]
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, 10); // Top 10 books
  
  return sortedBooks.map(book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    borrowCount: book.borrowCount,
  }));
};

// Generate overdue books report
export const generateOverdueReport = async (): Promise<OverdueReportItem[]> => {
  const books = await getAllBooks();
  const members = getAllMembers();
  const now = new Date();
  
  // Filter overdue books
  const overdueBooks = books.filter(book => 
    book.status === 'Borrowed' && 
    book.dueDate && 
    new Date(book.dueDate) < now
  );
  
  return overdueBooks.map(book => {
    const member = members.find(member => member.id === book.borrowedBy);
    const dueDate = book.dueDate instanceof Date ? book.dueDate : book.dueDate ? new Date(book.dueDate) : now;
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      bookId: book.id,
      title: book.title,
      author: book.author,
      memberName: member ? member.name : 'Unknown',
      memberApartment: member ? member.apartmentNumber : 'Unknown',
      daysOverdue,
      fine: daysOverdue * 5, // 5 rupees per day
    };
  });
};

// Generate defaulters report
export const generateDefaultersReport = (): DefaulterReportItem[] => {
  const members = getAllMembers();
  const records = getAllBorrowRecords();
  
  // Count overdue instances for each member
  const defaulterCounts: Record<string, DefaulterReportItem> = {};
  
  records.forEach(record => {
    const dueDate = record.dueDate instanceof Date ? record.dueDate : new Date(record.dueDate);
    const returnDate = record.returnDate 
      ? (record.returnDate instanceof Date ? record.returnDate : new Date(record.returnDate)) 
      : new Date();
    
    if (returnDate > dueDate) {
      const memberId = record.memberId;
      const member = members.find(m => m.id === memberId);
      
      if (member) {
        if (!defaulterCounts[memberId]) {
          defaulterCounts[memberId] = {
            memberId,
            name: member.name,
            apartment: member.apartmentNumber,
            overdueCount: 0,
            totalFines: 0,
          };
        }
        
        defaulterCounts[memberId].overdueCount += 1;
        
        // Calculate fine for this record
        const overdueDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        defaulterCounts[memberId].totalFines += overdueDays * 5; // 5 rupees per day
      }
    }
  });
  
  // Convert to array and sort by overdue count (descending)
  return Object.values(defaulterCounts)
    .sort((a, b) => b.overdueCount - a.overdueCount)
    .slice(0, 10); // Top 10 defaulters
};

// Generate category popularity report
export const generateCategoryReport = async (): Promise<CategoryReportItem[]> => {
  const records = getAllBorrowRecords();
  const books = await getAllBooks();
  
  // Count borrows by category
  const categoryCounts: Record<string, number> = {
    'Fiction': 0,
    'Non-Fiction': 0,
    'Children': 0,
  };
  
  records.forEach(record => {
    const book = books.find(book => book.id === record.bookId);
    
    if (book) {
      categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
    }
  });
  
  // Convert to array format for charts
  return Object.entries(categoryCounts).map(([category, count]) => ({
    name: category,
    count,
  }));
};

// Get all reports
export const getAllReports = (): Report[] => {
  const reports = localStorage.getItem('reports');
  return reports ? JSON.parse(reports) : [];
};

// Generate all reports
export const generateAllReports = async (): Promise<void> => {
  const reports = getAllReports();
  
  // Update each report with fresh data
  const updatedReportsPromises = reports.map(async report => {
    let data: ReportItem[] = [];
    
    switch (report.type) {
      case 'monthly':
        data = await generateMonthlyReport();
        break;
      case 'popular':
        data = await generatePopularBooksReport();
        break;
      case 'overdue':
        data = await generateOverdueReport();
        break;
      case 'defaulters':
        data = generateDefaultersReport();
        break;
      case 'category':
        data = await generateCategoryReport();
        break;
    }
    
    return { ...report, data };
  });
  
  const updatedReports = await Promise.all(updatedReportsPromises);
  localStorage.setItem('reports', JSON.stringify(updatedReports));
};

// Export report to CSV format
export const exportReportToCSV = (reportId: string): string => {
  const reports = getAllReports();
  const report = reports.find(r => r.id === reportId);
  
  if (!report || !report.data || report.data.length === 0) {
    return '';
  }
  
  let csv = '';
  
  // Helper function to safely access nested properties
  const safeGet = <T, K extends keyof T>(obj: T, key: K): T[K] | '' => {
    return obj ? obj[key] : '';
  };
  
  // Handle different report types differently
  switch (report.type) {
    case 'monthly': {
      csv = 'Name,Value\n';
      report.data.forEach(item => {
        const monthlyItem = item as MonthlyReportItem;
        if (monthlyItem.name !== 'Daily Breakdown') {
          csv += `${monthlyItem.name},${typeof monthlyItem.value === 'number' ? monthlyItem.value : 'N/A'}\n`;
        }
      });
      break;
    }
      
    case 'popular': {
      csv = 'Title,Author,Category,Borrow Count\n';
      report.data.forEach(item => {
        const bookItem = item as BookReportItem;
        csv += `"${safeGet(bookItem, 'title')}","${safeGet(bookItem, 'author')}",${safeGet(bookItem, 'category')},${safeGet(bookItem, 'borrowCount')}\n`;
      });
      break;
    }
      
    case 'overdue': {
      csv = 'Book Title,Author,Member Name,Apartment,Days Overdue,Fine\n';
      report.data.forEach(item => {
        const overdueItem = item as OverdueReportItem;
        csv += `"${safeGet(overdueItem, 'title')}","${safeGet(overdueItem, 'author')}","${safeGet(overdueItem, 'memberName')}",${safeGet(overdueItem, 'memberApartment')},${safeGet(overdueItem, 'daysOverdue')},${safeGet(overdueItem, 'fine')}\n`;
      });
      break;
    }
      
    case 'defaulters': {
      csv = 'Member Name,Apartment,Overdue Count,Total Fines\n';
      report.data.forEach(item => {
        const defaulterItem = item as DefaulterReportItem;
        csv += `"${safeGet(defaulterItem, 'name')}",${safeGet(defaulterItem, 'apartment')},${safeGet(defaulterItem, 'overdueCount')},${safeGet(defaulterItem, 'totalFines')}\n`;
      });
      break;
    }
      
    case 'category': {
      csv = 'Category,Count\n';
      report.data.forEach(item => {
        const categoryItem = item as CategoryReportItem;
        csv += `${safeGet(categoryItem, 'name')},${safeGet(categoryItem, 'count')}\n`;
      });
      break;
    }
  }
  
  return csv;
};

// Initialize reports with fresh data
export const initializeReports = async (): Promise<void> => {
  await generateAllReports();
};