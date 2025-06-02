import { supabase } from '../lib/supabase';
import { Member, BorrowRecord } from '../types';

// Get all members
export const getAllMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
  
  // Also fetch active loans for each member
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .is('returned_on', null);
    
  if (loansError) {
    console.error('Error fetching loans:', loansError);
    throw loansError;
  }
  
  return data.map(member => ({
    id: member.id,
    name: member.name || '',
    phone: member.mobile_number || '',
    apartmentNumber: member.flat_number || '',
    borrowedBooks: loans 
      ? loans.filter(loan => loan.member_id === member.id).map(loan => loan.book_id)
      : [],
    borrowHistory: [],
    fines: parseFloat(member.total_amount_due) || 0
  }));
};

// Get member by ID
export const getMemberById = async (id: string): Promise<Member | null> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !data) {
    console.error('Error fetching member:', error);
    return null;
  }
  
  // Get active loans for this member
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .eq('member_id', id)
    .is('returned_on', null);
    
  if (loansError) {
    console.error('Error fetching loans:', loansError);
    throw loansError;
  }
  
  return {
    id: data.id,
    name: data.name || '',
    phone: data.mobile_number || '',
    apartmentNumber: data.flat_number || '',
    borrowedBooks: loans ? loans.map(loan => loan.book_id) : [],
    borrowHistory: [],
    fines: parseFloat(data.total_amount_due) || 0
  };
};

// Search members
export const searchMembers = async (query: string): Promise<Member[]> => {
  // Clean and prepare the search query
  const searchTerm = query.trim().toLowerCase();
  
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,mobile_number.ilike.%${searchTerm}%,flat_number.ilike.%${searchTerm}%`)
    .order('name');
    
  if (error) {
    console.error('Error searching members:', error);
    throw error;
  }
  
  // Get all active loans
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .is('returned_on', null);
    
  if (loansError) {
    console.error('Error fetching loans:', loansError);
    throw loansError;
  }
  
  return data.map(member => ({
    id: member.id,
    name: member.name || '',
    phone: member.mobile_number || '',
    apartmentNumber: member.flat_number || '',
    borrowedBooks: loans 
      ? loans.filter(loan => loan.member_id === member.id).map(loan => loan.book_id)
      : [],
    borrowHistory: [],
    fines: parseFloat(member.total_amount_due) || 0
  }));
};

// Add new member
export const addMember = async (member: Omit<Member, 'id' | 'borrowedBooks' | 'borrowHistory' | 'fines'>): Promise<Member> => {
  const { data, error } = await supabase
    .from('members')
    .insert([{
      name: member.name,
      mobile_number: member.phone,
      flat_number: member.apartmentNumber,
      membership_status: 'PENDING',
      total_amount_due: 0
    }])
    .select()
    .single();
    
  if (error || !data) {
    console.error('Error adding member:', error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    phone: data.mobile_number,
    apartmentNumber: data.flat_number,
    borrowedBooks: [],
    borrowHistory: [],
    fines: 0
  };
};

// Update member
export const updateMember = async (updatedMember: Member): Promise<Member> => {
  const { data, error } = await supabase
    .from('members')
    .update({
      name: updatedMember.name,
      mobile_number: updatedMember.phone,
      flat_number: updatedMember.apartmentNumber,
      total_amount_due: updatedMember.fines
    })
    .eq('id', updatedMember.id)
    .select()
    .single();
    
  if (error || !data) {
    console.error('Error updating member:', error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    phone: data.mobile_number,
    apartmentNumber: data.flat_number,
    borrowedBooks: updatedMember.borrowedBooks,
    borrowHistory: updatedMember.borrowHistory,
    fines: parseFloat(data.total_amount_due) || 0
  };
};

// Delete member
export const deleteMember = async (id: string): Promise<boolean> => {
  // First check if member has any active loans
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .eq('member_id', id)
    .is('returned_on', null);
    
  if (loansError) {
    console.error('Error checking loans:', loansError);
    throw loansError;
  }
  
  if (loans && loans.length > 0) {
    return false; // Cannot delete member with active loans
  }
  
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
  
  return true;
};

// Pay or waive fine
export const updateMemberFine = async (id: string, amount: number, isWaive: boolean = false): Promise<Member | null> => {
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('total_amount_due')
    .eq('id', id)
    .single();
    
  if (memberError || !member) {
    console.error('Error fetching member:', memberError);
    return null;
  }
  
  const currentFine = parseFloat(member.total_amount_due) || 0;
  const newFine = isWaive ? 0 : Math.max(0, currentFine - amount);
  
  const { data, error } = await supabase
    .from('members')
    .update({ total_amount_due: newFine })
    .eq('id', id)
    .select()
    .single();
    
  if (error || !data) {
    console.error('Error updating fine:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    phone: data.mobile_number,
    apartmentNumber: data.flat_number,
    borrowedBooks: [], // We'll need to fetch this from loans table
    borrowHistory: [], // We'll need to fetch this from loans table
    fines: parseFloat(data.total_amount_due) || 0
  };
};

// Get member's borrow history
export const getMemberBorrowHistory = async (id: string): Promise<BorrowRecord[]> => {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      *,
      book:book_id (*)
    `)
    .eq('member_id', id)
    .order('issued_on', { ascending: false });
    
  if (error) {
    console.error('Error fetching borrow history:', error);
    throw error;
  }
  
  return data.map(loan => ({
    id: loan.id,
    bookId: loan.book_id,
    memberId: loan.member_id,
    borrowDate: new Date(loan.issued_on),
    dueDate: new Date(loan.due_on),
    returnDate: loan.returned_on ? new Date(loan.returned_on) : undefined,
    renewed: loan.is_renewed || false,
    fine: loan.fine_amount
  }));
};

// Get active borrowers count
export const getActiveBorrowersCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('loans')
    .select('member_id', { count: 'exact', head: true })
    .is('returned_on', null);
    
  if (error) {
    console.error('Error counting active borrowers:', error);
    throw error;
  }
  
  return count || 0;
};

// Get total fines
export const getTotalFines = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('members')
    .select('total_amount_due');
    
  if (error) {
    console.error('Error calculating total fines:', error);
    throw error;
  }
  
  return data.reduce((total, member) => total + (parseFloat(member.total_amount_due) || 0), 0);
};