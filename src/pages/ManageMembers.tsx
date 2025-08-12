import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Users, Phone, MapPin, Calendar, X, Check, Grid, List } from 'lucide-react';
import { Member } from '../types';
import { getAllMembers, searchMembers, addMember } from '../services/memberService';
import { format } from 'date-fns';

const ManageMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state variables
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    apartmentNumber: '',
    email: '',
    paymentReceived: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMembers();
      setMembers(data);
      setFilteredMembers(data);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }
    
    try {
      setIsLoading(true);
      const searchResults = await searchMembers(searchQuery);
      setFilteredMembers(searchResults);
    } catch (err) {
      console.error('Error searching members:', err);
      setError('Failed to search members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadMembers();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMember(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await addMember(newMember);
      setNewMember({ 
        name: '', 
        phone: '', 
        apartmentNumber: '', 
        email: '', 
        paymentReceived: ''
      });
      setIsAddModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      loadMembers();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {filteredMembers.map(member => (
        <Link 
          key={member.id}
          to={`/manage-members/${member.id}`}
          className="card hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="flex items-start justify-between mb-3 lg:mb-4">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-primary-900 group-hover:text-primary-700 transition-colors">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-600">Member</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 lg:space-y-3">
            <div className="flex items-center text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              <span className="text-sm lg:text-base">{member.phone}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm lg:text-base">Apartment {member.apartmentNumber}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm lg:text-base">
                Joined {member.membershipDate ? format(new Date(member.membershipDate), 'dd MMM yyyy') : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-2 lg:pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2 lg:space-x-4">
                <span className="px-2 py-1 text-xs lg:text-sm font-semibold rounded-full bg-primary-100 text-primary-800">
                  {member.borrowedBooks.length}/2 Books
                </span>
                {member.fines > 0 && (
                  <span className="px-2 py-1 text-xs lg:text-sm font-semibold rounded-full bg-accent-100 text-accent-800">
                    ₹{member.fines} Fine
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-md rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-primary-50">
              <tr>
                <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Date Joined
                </th>
                <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Books
                </th>
                <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Fines
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/manage-members/${member.id}`}
                      className="flex items-center space-x-2 lg:space-x-3 group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <Users className="w-4 h-4 lg:w-5 lg:h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="text-sm lg:text-base font-medium text-gray-900 group-hover:text-primary-600">
                          {member.name}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-500">Apartment {member.apartmentNumber}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm lg:text-base text-gray-900">{member.phone}</div>
                    {member.email && (
                      <div className="text-xs lg:text-sm text-gray-500">{member.email}</div>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-sm lg:text-base text-gray-500">
                    {member.membershipDate ? format(new Date(member.membershipDate), 'dd MMM yyyy') : 'N/A'}
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs lg:text-sm font-semibold rounded-full bg-primary-100 text-primary-800">
                      {member.borrowedBooks.length}/2
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    {member.fines > 0 ? (
                      <span className="px-2 py-1 text-xs lg:text-sm font-semibold rounded-full bg-accent-100 text-accent-800">
                        ₹{member.fines}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Members</h1>
            <p className="text-lg text-gray-600">Add, edit, and view member details</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Grid View"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List View"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary inline-flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span>Add New Member</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search members by name, phone, or apartment..."
              className="input-field pl-10 w-full"
              value={searchQuery}
              onChange={handleSearchInputChange}
              disabled={isLoading}
            />
            <Search className="absolute left-3 top-4 h-6 w-6 text-gray-400" />
            <button 
              type="submit" 
              className="btn btn-primary absolute right-1 top-1"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Members Display */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-500">Loading members...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          viewMode === 'grid' ? renderGridView() : renderListView()
        ) : (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery ? 'No members found' : 'No members yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Get started by adding your first member'
              }
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Add First Member</span>
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {filteredMembers.length > 0 && (
          <div className="text-center text-gray-500">
            Showing {filteredMembers.length} of {members.length} members
          </div>
        )}

        {/* Add Member Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Add New Member</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newMember.name}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newMember.phone}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newMember.email}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Received
                  </label>
                  <input
                    type="text"
                    name="paymentReceived"
                    value={newMember.paymentReceived}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="e.g., ₹500, $50, etc."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apartment Number
                  </label>
                  <input
                    type="text"
                    name="apartmentNumber"
                    value={newMember.apartmentNumber}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <Check className="h-5 w-5" />
            <span>Member added successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMembers; 