import { Member, BorrowRecord } from '../types';

// Get all members
export const getAllMembers = (): Member[] => {
  const members = localStorage.getItem('members');
  return members ? JSON.parse(members) : [];
};

// Get member by ID
export const getMemberById = (id: string): Member | null => {
  const members = getAllMembers();
  return members.find(member => member.id === id) || null;
};

// Search members by name, phone, or apartment
export const searchMembers = (query: string): Member[] => {
  const members = getAllMembers();
  const lowercaseQuery = query.toLowerCase();
  
  return members.filter(
    member =>
      member.name.toLowerCase().includes(lowercaseQuery) ||
      member.phone.includes(query) ||
      member.apartmentNumber.toLowerCase().includes(lowercaseQuery)
  );
};

// Add new member
export const addMember = (member: Omit<Member, 'id' | 'borrowedBooks' | 'borrowHistory' | 'fines'>): Member => {
  const members = getAllMembers();
  
  const newMember: Member = {
    id: Date.now().toString(),
    ...member,
    borrowedBooks: [],
    borrowHistory: [],
    fines: 0,
  };
  
  localStorage.setItem('members', JSON.stringify([...members, newMember]));
  
  return newMember;
};

// Update member
export const updateMember = (updatedMember: Member): Member => {
  const members = getAllMembers();
  const updatedMembers = members.map(member => 
    member.id === updatedMember.id ? updatedMember : member
  );
  
  localStorage.setItem('members', JSON.stringify(updatedMembers));
  
  return updatedMember;
};

// Delete member
export const deleteMember = (id: string): boolean => {
  const members = getAllMembers();
  const member = getMemberById(id);
  
  if (!member) return false;
  
  // Check if member has borrowed books
  if (member.borrowedBooks.length > 0) {
    return false;
  }
  
  const updatedMembers = members.filter(member => member.id !== id);
  localStorage.setItem('members', JSON.stringify(updatedMembers));
  
  return true;
};

// Pay or waive fine
export const updateMemberFine = (id: string, amount: number, isWaive: boolean = false): Member | null => {
  const member = getMemberById(id);
  
  if (!member) return null;
  
  const updatedMember = {
    ...member,
    fines: isWaive ? 0 : Math.max(0, member.fines - amount)
  };
  
  return updateMember(updatedMember);
};

// Get member's borrow history
export const getMemberBorrowHistory = (id: string): BorrowRecord[] => {
  const borrowRecords = localStorage.getItem('borrowRecords');
  
  if (!borrowRecords) return [];
  
  const records: BorrowRecord[] = JSON.parse(borrowRecords);
  return records.filter(record => record.memberId === id);
};

// Get active borrowers count
export const getActiveBorrowersCount = (): number => {
  const members = getAllMembers();
  return members.filter(member => member.borrowedBooks.length > 0).length;
};

// Get total fines
export const getTotalFines = (): number => {
  const members = getAllMembers();
  return members.reduce((total, member) => total + member.fines, 0);
};