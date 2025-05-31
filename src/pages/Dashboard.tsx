import React, { useEffect, useState } from 'react';
import { BarChart, PieChart, BookOpen, Users, AlertCircle, PiggyBank } from 'lucide-react';
import { BarChart as RechartBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAvailableBooksCount, getBorrowedBooksCount, getOverdueBooks } from '../services/bookService';
import { getActiveBorrowersCount, getTotalFines } from '../services/memberService';
import { generatePopularBooksReport, generateCategoryReport } from '../services/reportService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    overdueBooks: 0,
    activeBorrowers: 0,
    totalFines: 0,
  });

  interface BookReportItem {
    id: string;
    title: string;
    author: string;
    category: string;
    borrowCount: number;
  }

  interface CategoryReportItem {
    name: string;
    count: number;
  }

  const [popularBooks, setPopularBooks] = useState<BookReportItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryReportItem[]>([]);

  useEffect(() => {
    // Fetch dashboard data asynchronously
    const fetchData = async () => {
      try {
        // Get dashboard data
        const books = JSON.parse(localStorage.getItem('books') || '[]');
        const availableBooks = await getAvailableBooksCount();
        const borrowedBooks = await getBorrowedBooksCount();
        const overdueBooks = (await getOverdueBooks()).length;
        const activeBorrowers = getActiveBorrowersCount();
        const totalFines = getTotalFines();
        
        setStats({
          totalBooks: books.length,
          availableBooks,
          borrowedBooks,
          overdueBooks,
          activeBorrowers,
          totalFines,
        });

        // Get popular books for chart
        const popularBooksData = await generatePopularBooksReport();
        setPopularBooks(popularBooksData.slice(0, 5));

        // Get category data for chart
        const categoriesData = await generateCategoryReport();
        setCategoryData(categoriesData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-lg text-gray-600">Library statistics and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary-100">
                <BookOpen className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <p className="text-lg text-gray-600">Total Books</p>
                <h3 className="text-3xl font-bold">{stats.totalBooks}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="text-primary-600">{stats.availableBooks} available</span>
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary-100">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <p className="text-lg text-gray-600">Active Borrowers</p>
                <h3 className="text-3xl font-bold">{stats.activeBorrowers}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="text-primary-600">{stats.borrowedBooks} books borrowed</span>
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-accent-100">
                <AlertCircle className="h-8 w-8 text-accent-500" />
              </div>
              <div>
                <p className="text-lg text-gray-600">Overdue Books</p>
                <h3 className="text-3xl font-bold">{stats.overdueBooks}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="text-accent-500">Need attention</span>
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-accent-100">
                <PiggyBank className="h-8 w-8 text-accent-500" />
              </div>
              <div>
                <p className="text-lg text-gray-600">Total Fines</p>
                <h3 className="text-3xl font-bold">₹{stats.totalFines}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="text-accent-500">Pending collection</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Books Chart */}
          <div className="card bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Most Popular Books</h2>
              <BarChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartBarChart
                  data={popularBooks}
                  margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="title" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Borrow Count']}
                    labelFormatter={(value) => `Title: ${value}`}
                  />
                  <Bar dataKey="borrowCount" fill="#4f56e6" />
                </RechartBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="card bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Category Distribution</h2>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartBarChart
                  data={categoryData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Borrow Count']}
                    labelFormatter={(value) => `Category: ${value}`}
                  />
                  <Bar dataKey="count" fill="#ff6a15" />
                </RechartBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;