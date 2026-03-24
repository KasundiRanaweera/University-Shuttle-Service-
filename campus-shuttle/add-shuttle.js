const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  const { data, error } = await supabase
    .from('shuttle_route')
    .insert([{
      bus_number: 'BUS-101',
      start_location: 'Main Campus',
      end_location: 'City Center',
      departure_time: '08:00',
      arrival_time: '08:45',
      duration_minutes: 45,
      number_of_stops: 5,
      total_seats: 20,
      price_per_seat: 50,
      status: 'Available',
      driver_id: 65
    }]);
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ Shuttle route BUS-101 added successfully!');
    console.log('Go to http://localhost:5174 and refresh your browser');
  }
})();
