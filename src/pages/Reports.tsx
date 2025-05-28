import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, LineChart, Download, RefreshCcw, FileText } from 'lucide-react';
import { 
  BarChart as RechartBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartPieChart,
  Pie,
  Cell
} from 'recharts';
import { Report } from '../types';
import { 
  getAllReports, 
  generateAllReports, 
  exportReportToCSV 
} from '../services/reportService';

// Pie chart colors
const COLORS = ['#4f56e6', '#6580aa', '#ff6a15', '#10B981', '#F59E0B', '#EF4444'];

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = getAllReports();
    setReports(allReports);
    
    // Select the first report by default
    if (allReports.length > 0 && !selectedReport) {
      setSelectedReport(allReports[0]);
    }
  };

  const handleGenerateReports = () => {
    setIsGenerating(true);
    
    // Generate new reports
    generateAllReports();
    
    // Load updated reports
    setTimeout(() => {
      loadReports();
      setIsGenerating(false);
    }, 500);
  };

  const handleExportCSV = () => {
    if (!selectedReport) return;
    
    const csv = exportReportToCSV(selectedReport.id);
    
    // Create a Blob and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedReport.name.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMonthlyReport = () => {
    if (!selectedReport || !selectedReport.data || selectedReport.data.length === 0) {
      return <p className="text-center text-lg text-gray-500 py-6">No data available</p>;
    }
    
    const totalBorrowed = selectedReport.data.find(item => item.name === 'Total Borrowed')?.value || 0;
    const totalReturned = selectedReport.data.find(item => item.name === 'Total Returned')?.value || 0;
    const dailyBreakdown = selectedReport.data.find(item => item.name === 'Daily Breakdown')?.value || [];
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Monthly Summary</h3>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-gray-600">Borrowed</p>
                <p className="text-3xl font-bold text-primary-600">{totalBorrowed}</p>
              </div>
              <div>
                <p className="text-gray-600">Returned</p>
                <p className="text-3xl font-bold text-accent-500">{totalReturned}</p>
              </div>
              <div>
                <p className="text-gray-600">Net</p>
                <p className={`text-3xl font-bold ${totalBorrowed - totalReturned > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalBorrowed - totalReturned}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Daily Activity</h3>
            {dailyBreakdown.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartBarChart
                    data={dailyBreakdown}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="borrowed" fill="#4f56e6" name="Borrowed" />
                    <Bar dataKey="returned" fill="#ff6a15" name="Returned" />
                  </RechartBarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-lg text-gray-500 py-6">No daily data available</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPopularBooksReport = () => {
    if (!selectedReport || !selectedReport.data || selectedReport.data.length === 0) {
      return <p className="text-center text-lg text-gray-500 py-6">No data available</p>;
    }
    
    return (
      <div className="space-y-8">
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4">Top 10 Most Borrowed Books</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RechartBarChart
                data={selectedReport.data}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="title" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => [value, 'Borrow Count']}
                  labelFormatter={(value) => `Title: ${value}`}
                />
                <Legend />
                <Bar dataKey="borrowCount" name="Borrow Count" fill="#4f56e6" />
              </RechartBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-primary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Borrows
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedReport.data.map((book, index) => (
                <tr key={book.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-lg font-medium text-primary-700">
                    {book.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                    {book.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                    {book.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-right font-medium">
                    {book.borrowCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOverdueReport = () => {
    if (!selectedReport || !selectedReport.data || selectedReport.data.length === 0) {
      return <p className="text-center text-lg text-gray-500 py-6">No overdue books at this time</p>;
    }
    
    // Calculate total fines
    const totalFines = selectedReport.data.reduce((sum, item) => sum + item.fine, 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Overdue Summary</h3>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-gray-600">Total Overdue</p>
                <p className="text-3xl font-bold text-accent-600">{selectedReport.data.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Fines</p>
                <p className="text-3xl font-bold text-accent-600">₹{totalFines}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-primary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Book
                </th>
                <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Apartment
                </th>
                <th scope="col" className="px-6 py-3 text-right text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th scope="col" className="px-6 py-3 text-right text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Fine
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedReport.data.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-medium text-primary-700">{item.title}</div>
                    <div className="text-gray-600">{item.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                    {item.memberName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                    {item.memberApartment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-right font-medium text-accent-600">
                    {item.daysOverdue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-right font-medium text-accent-600">
                    ₹{item.fine}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDefaultersReport = () => {
    if (!selectedReport || !selectedReport.data || selectedReport.data.length === 0) {
      return <p className="text-center text-lg text-gray-500 py-6">No defaulters at this time</p>;
    }
    
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4">Members with Most Overdue Instances</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartBarChart
                data={selectedReport.data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'overdueCount' ? 'Overdue Instances' : 'Total Fines (₹)']}
                  labelFormatter={(value) => `Member: ${value}`}
                />
                <Legend />
                <Bar dataKey="overdueCount" name="Overdue Instances" fill="#4f56e6" />
                <Bar dataKey="totalFines" name="Total Fines (₹)" fill="#ff6a15" />
              </RechartBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-primary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Apartment
                </th>
                <th scope="col" className="px-6 py-3 text-right text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Overdue Instances
                </th>
                <th scope="col" className="px-6 py-3 text-right text-lg font-medium text-primary-900 uppercase tracking-wider">
                  Total Fines
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedReport.data.map((item, index) => (
                <tr key={item.memberId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-lg font-medium text-primary-700">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                    {item.apartment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-right font-medium">
                    {item.overdueCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-right font-medium text-accent-600">
                    ₹{item.totalFines}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCategoryReport = () => {
    if (!selectedReport || !selectedReport.data || selectedReport.data.length === 0) {
      return <p className="text-center text-lg text-gray-500 py-6">No data available</p>;
    }
    
    // Calculate total borrows
    const totalBorrows = selectedReport.data.reduce((sum, item) => sum + item.count, 0);
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Category Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPieChart>
                  <Pie
                    data={selectedReport.data}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {selectedReport.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} borrows`, 'Count']} />
                </RechartPieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Category Breakdown</h3>
            <div className="space-y-6">
              {selectedReport.data.map((category, index) => (
                <div key={category.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium">{category.name}</span>
                    <span className="text-lg">
                      {category.count} ({((category.count / totalBorrows) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="h-4 rounded-full"
                      style={{
                        width: `${(category.count / totalBorrows) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (!selectedReport) return null;
    
    switch (selectedReport.type) {
      case 'monthly':
        return renderMonthlyReport();
      case 'popular':
        return renderPopularBooksReport();
      case 'overdue':
        return renderOverdueReport();
      case 'defaulters':
        return renderDefaultersReport();
      case 'category':
        return renderCategoryReport();
      default:
        return null;
    }
  };

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports</h1>
            <p className="text-lg text-gray-600">Analyze library data with detailed reports.</p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={handleGenerateReports}
              className="btn btn-secondary flex items-center"
              disabled={isGenerating}
            >
              <RefreshCcw className={`h-5 w-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : 'Refresh Reports'}</span>
            </button>
            
            <button 
              onClick={handleExportCSV}
              className="btn btn-primary flex items-center"
              disabled={!selectedReport}
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
        
        {/* Report selection */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {reports.map(report => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={`p-4 rounded-lg flex flex-col items-center transition-colors duration-200 ${
                selectedReport?.id === report.id 
                  ? 'bg-primary-100 border-2 border-primary-300 text-primary-800' 
                  : 'bg-white border border-gray-200 hover:bg-primary-50 text-gray-700'
              }`}
            >
              {report.type === 'monthly' && <BarChart className="h-6 w-6 mb-2" />}
              {report.type === 'popular' && <BarChart className="h-6 w-6 mb-2" />}
              {report.type === 'overdue' && <FileText className="h-6 w-6 mb-2" />}
              {report.type === 'defaulters' && <FileText className="h-6 w-6 mb-2" />}
              {report.type === 'category' && <PieChart className="h-6 w-6 mb-2" />}
              <span className="text-center font-medium">{report.name}</span>
            </button>
          ))}
        </div>
        
        {/* Report content */}
        {selectedReport && (
          <div className="card">
            <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedReport.name}</h2>
                <p className="text-gray-600">{selectedReport.description}</p>
              </div>
            </div>
            
            {renderReportContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;