import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ===== SERVIÇOS =====
export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function updateService(id, updates) {
  const { error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

// ===== HORÁRIOS =====
export async function getBusinessHours() {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .order('day_of_week');
  if (error) throw error;
  const hours = {};
  data.forEach(row => {
    hours[row.day_of_week] = row.is_open
      ? { open: row.open_time, close: row.close_time, breaks: row.breaks || [] }
      : null;
  });
  return hours;
}

export async function updateBusinessHours(dayOfWeek, isOpen, openTime, closeTime, breaks) {
  const { error } = await supabase
    .from('business_hours')
    .update({
      is_open: isOpen,
      open_time: openTime || '10:00',
      close_time: closeTime || '20:00',
      breaks: breaks || []
    })
    .eq('day_of_week', dayOfWeek);
  if (error) throw error;
}

// ===== AGENDAMENTOS =====
export async function getAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date')
    .order('time');
  if (error) throw error;
  return data;
}

export async function createAppointment(appointment) {
  const { data, error } = await supabase
    .from('appointments')
    .insert([{
      services: appointment.services,
      service_ids: appointment.serviceIds,
      total_duration: appointment.totalDuration,
      active_duration: appointment.activeDuration,
      has_passive: appointment.hasPassive,
      total_price: appointment.totalPrice,
      date: appointment.date,
      time: appointment.time,
      client_name: appointment.clientName,
      client_phone: appointment.clientPhone,
      status: 'confirmado'
    }])
    .select();
  if (error) throw error;
  return data[0];
}

export async function cancelAppointment(id) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelado' })
    .eq('id', id);
  if (error) throw error;
}

// ===== CONFIGURAÇÕES =====
export async function getSetting(key) {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error) return null;
  return data?.value;
}

export async function updateSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .update({ value })
    .eq('key', key);
  if (error) throw error;
}
