import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, UserPlus, X, Check } from 'lucide-react';
import { Member } from '../types';
import { getAllMembers, searchMembers, addMember } from '../services/memberService';

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    apartmentNumber: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (searchQuery.trim()) {
        const results = await searchMembers(searchQuery);
        setMembers(results);
      } else {
        const allMembers = await getAllMembers();
        setMembers(allMembers);
      }
    } catch (err) {
      console.error('Error searching members:', err);
      setError('Failed to search members. Please try again.');
    } finally {
      setIsLoading(false);
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
      setNewMember({ name: '', phone: '', apartmentNumber: '' });
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

  if (isLoading && members.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading members...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex flex-col space-y-6">
        {/* Header with search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-2">Members</h1>
            <p className="text-lg text-gray-600">Manage library members and their details.</p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search by name, phone, or apartment..."
                className="input-field pl-10 w-full md:w-72"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-4 h-6 w-6 text-gray-400" />
            </form>
            
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary flex items-center justify-center space-x-2"
              disabled={isLoading}
            >
              <UserPlus className="h-5 w-5" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              <span>Member added successfully!</span>
            </div>
            <button onClick={() => setShowSuccess(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Members Table */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow-md rounded-xl">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                      Apartment
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                      Books
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-lg font-medium text-primary-900 uppercase tracking-wider">
                      Fines
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-lg font-medium text-primary-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.length > 0 ? (
                    members.map(member => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-lg">
                          <Link to={`/members/${member.id}`} className="font-medium text-primary-700 hover:text-primary-900">
                            {member.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg">
                          {member.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg">
                          {member.apartmentNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg">
                          {member.borrowedBooks.length > 0 ? (
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                              {member.borrowedBooks.length} Books
                            </span>
                          ) : (
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              None
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg">
                          {member.fines > 0 ? (
                            <span className="text-accent-600 font-medium">₹{member.fines}</span>
                          ) : (
                            <span className="text-green-600">No fines</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-lg">
                          <Link
                            to={`/members/${member.id}`}
                            className="text-primary-600 hover:text-primary-900 font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-lg text-gray-500">
                        No members found. {searchQuery && 'Try a different search query.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddMember}>
                <div className="bg-white px-6 pt-5 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Add New Member</h3>
                    <button 
                      type="button" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="input-field"
                        value={newMember.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-lg font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        className="input-field"
                        value={newMember.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="apartmentNumber" className="block text-lg font-medium text-gray-700 mb-1">
                        Apartment Number
                      </label>
                      <input
                        type="text"
                        id="apartmentNumber"
                        name="apartmentNumber"
                        className="input-field"
                        value={newMember.apartmentNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;