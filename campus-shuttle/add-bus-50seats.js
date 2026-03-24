const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  const { data, error } = await supabase
    .from('shuttle_route')
    .insert([{
      bus_number: 'BUS-102',
      start_location: 'University Gate',
      end_location: 'Shopping Mall',
      departure_time: '10:00',
      arrival_time: '10:45',
      duration_minutes: 45,
      number_of_stops: 4,
      total_seats: 50,
      price_per_seat: 75,
      status: 'Available',
      driver_id: 65
    }]);
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ BUS-102 with 50 seats added!');
    console.log('Refresh dashboard and click "Book Now" on BUS-102');
    console.log('You should see 50 seat options in the booking page');
  }
})();
