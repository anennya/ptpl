import { supabase } from "../lib/supabase";

export interface Fine {
  id: string;
  memberId: string;
  bookId?: string;
  daysOverdue: number;
  fineAmount: number;
  isPaid: boolean;
  waived: boolean;
  waivedReason?: string;
  clearedBy?: string;
  recordedOn: Date;
}

// Add a new fine
export const addFine = async (fine: Omit<Fine, 'id' | 'recordedOn'>): Promise<Fine> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('fines')
    .insert([{
      member_id: fine.memberId,
      book_id: fine.bookId || null,
      days_overdue: fine.daysOverdue,
      fine_amount: fine.fineAmount,
      is_paid: false,
      waived: false,
      waived_reason: null,
      cleared_by: user?.id || null,
      recorded_on: new Date().toISOString()
    }])
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding fine:', error);
    throw error;
  }

  return {
    id: data.id,
    memberId: data.member_id,
    bookId: data.book_id,
    daysOverdue: data.days_overdue,
    fineAmount: data.fine_amount,
    isPaid: data.is_paid,
    waived: data.waived,
    waivedReason: data.waived_reason,
    clearedBy: data.cleared_by,
    recordedOn: new Date(data.recorded_on)
  };
};

// Get fines for a member
export const getMemberFines = async (memberId: string): Promise<Fine[]> => {
  const { data, error } = await supabase
    .from('fines')
    .select('*')
    .eq('member_id', memberId)
    .order('recorded_on', { ascending: false });

  if (error) {
    console.error('Error fetching member fines:', error);
    throw error;
  }

  return data.map(fine => ({
    id: fine.id,
    memberId: fine.member_id,
    bookId: fine.book_id,
    daysOverdue: fine.days_overdue,
    fineAmount: fine.fine_amount,
    isPaid: fine.is_paid,
    waived: fine.waived,
    waivedReason: fine.waived_reason,
    clearedBy: fine.cleared_by,
    recordedOn: new Date(fine.recorded_on)
  }));
};

// Pay a fine
export const payFine = async (fineId: string, amount: number): Promise<Fine> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('fines')
    .update({
      is_paid: true,
      cleared_by: user?.id || null
    })
    .eq('id', fineId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error paying fine:', error);
    throw error;
  }

  return {
    id: data.id,
    memberId: data.member_id,
    bookId: data.book_id,
    daysOverdue: data.days_overdue,
    fineAmount: data.fine_amount,
    isPaid: data.is_paid,
    waived: data.waived,
    waivedReason: data.waived_reason,
    clearedBy: data.cleared_by,
    recordedOn: new Date(data.recorded_on)
  };
};

// Waive a fine
export const waiveFine = async (fineId: string, reason: string): Promise<Fine> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('fines')
    .update({
      waived: true,
      waived_reason: reason,
      cleared_by: user?.id || null
    })
    .eq('id', fineId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error waiving fine:', error);
    throw error;
  }

  return {
    id: data.id,
    memberId: data.member_id,
    bookId: data.book_id,
    daysOverdue: data.days_overdue,
    fineAmount: data.fine_amount,
    isPaid: data.is_paid,
    waived: data.waived,
    waivedReason: data.waived_reason,
    clearedBy: data.cleared_by,
    recordedOn: new Date(data.recorded_on)
  };
}; 