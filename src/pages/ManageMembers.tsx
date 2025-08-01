import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Users, Phone, MapPin, X, Check } from 'lucide-react';
import { Member } from '../types';
import { getAllMembers, searchMembers, addMember } from '../services/memberService';

const ManageMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add these new state variables for the modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Update the newMember state to include paymentReceived
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
      setFilteredMembers(members);
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
      setNewMember({ name: '', phone: '', apartmentNumber: '', email: '', paymentReceived: '' }); // Reset paymentReceived too
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
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary inline-flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Add New Member</span>
          </button>
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

        {/* Members Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-500">Loading members...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map(member => (
              <Link 
                key={member.id}
                to={`/manage-members/${member.id}`}
                className="card hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary-900 group-hover:text-primary-700 transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-gray-600">Member</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{member.phone}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Apartment {member.apartmentNumber}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <span className="px-3 py-1 text-sm font-semibold rounded-full bg-primary-100 text-primary-800">
                        {member.borrowedBooks.length}/2 Books
                      </span>
                      {member.fines > 0 && (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-accent-100 text-accent-800">
                          ₹{member.fines} Fine
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
                    required
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