import { Book, Member, BorrowRecord, Report } from '../types';
import { getAllBooks, getBookById } from './bookService';
import { getAllMembers, getMemberById } from './memberService';
import { getAllBorrowRecords } from './circulationService';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Generate monthly circulation report
export const generateMonthlyReport = (): any[] => {
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
    const borrowDay = format(new Date(record.borrowDate), 'yyyy-MM-dd');
    
    if (!dailyData[borrowDay]) {
      dailyData[borrowDay] = { borrowed: 0, returned: 0 };
    }
    
    dailyData[borrowDay].borrowed += 1;
    
    if (record.returnDate) {
      const returnDay = format(new Date(record.returnDate), 'yyyy-MM-dd');
      
      if (!dailyData[returnDay]) {
        dailyData[returnDay] = { borrowed: 0, returned: 0 };
      }
      
      dailyData[returnDay].returned += 1;
    }
  });
  
  // Convert to array format for charts
  const dailyBreakdown = Object.entries(dailyData).map(([date, data]) => ({
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
export const generatePopularBooksReport = (): any[] => {
  const books = getAllBooks();
  
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
export const generateOverdueReport = (): any[] => {
  const books = getAllBooks();
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
    const daysOverdue = book.dueDate 
      ? Math.ceil((now.getTime() - new Date(book.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
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
export const generateDefaultersReport = (): any[] => {
  const members = getAllMembers();
  const records = getAllBorrowRecords();
  
  // Count overdue instances for each member
  const defaulterCounts: Record<string, { 
    memberId: string, 
    name: string, 
    apartment: string, 
    overdueCount: number,
    totalFines: number 
  }> = {};
  
  records.forEach(record => {
    const dueDate = new Date(record.dueDate);
    const returnDate = record.returnDate ? new Date(record.returnDate) : new Date();
    
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
export const generateCategoryReport = (): any[] => {
  const records = getAllBorrowRecords();
  const books = getAllBooks();
  
  // Count borrows by category
  const categoryCounts: Record<string, number> = {
    'Fiction': 0,
    'Non-Fiction': 0,
    'Children': 0,
  };
  
  records.forEach(record => {
    const book = books.find(book => book.id === record.bookId);
    
    if (book) {
      categoryCounts[book.category] += 1;
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
export const generateAllReports = (): void => {
  const reports = getAllReports();
  
  // Update each report with fresh data
  const updatedReports = reports.map(report => {
    let data: any[] = [];
    
    switch (report.type) {
      case 'monthly':
        data = generateMonthlyReport();
        break;
      case 'popular':
        data = generatePopularBooksReport();
        break;
      case 'overdue':
        data = generateOverdueReport();
        break;
      case 'defaulters':
        data = generateDefaultersReport();
        break;
      case 'category':
        data = generateCategoryReport();
        break;
    }
    
    return { ...report, data };
  });
  
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
  
  // Handle different report types differently
  switch (report.type) {
    case 'monthly':
      csv = 'Name,Value\n';
      report.data.forEach((item: any) => {
        if (item.name !== 'Daily Breakdown') {
          csv += `${item.name},${item.value}\n`;
        }
      });
      break;
      
    case 'popular':
      csv = 'Title,Author,Category,Borrow Count\n';
      report.data.forEach((item: any) => {
        csv += `"${item.title}","${item.author}",${item.category},${item.borrowCount}\n`;
      });
      break;
      
    case 'overdue':
      csv = 'Book Title,Author,Member Name,Apartment,Days Overdue,Fine\n';
      report.data.forEach((item: any) => {
        csv += `"${item.title}","${item.author}","${item.memberName}",${item.memberApartment},${item.daysOverdue},${item.fine}\n`;
      });
      break;
      
    case 'defaulters':
      csv = 'Member Name,Apartment,Overdue Count,Total Fines\n';
      report.data.forEach((item: any) => {
        csv += `"${item.name}",${item.apartment},${item.overdueCount},${item.totalFines}\n`;
      });
      break;
      
    case 'category':
      csv = 'Category,Count\n';
      report.data.forEach((item: any) => {
        csv += `${item.name},${item.count}\n`;
      });
      break;
  }
  
  return csv;
};

// Initialize reports with fresh data
export const initializeReports = (): void => {
  generateAllReports();
};