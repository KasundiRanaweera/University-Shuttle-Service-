# Campus Shuttle Booking System - Database Schema

## Overview

This database schema is designed for a campus shuttle booking system that **does not support booking cancellations**. All bookings are final once confirmed.

## Database Structure

### Core Tables

#### 1. `users`

- **Purpose**: Authentication and role management
- **Roles**: student, driver, admin
- **Key Fields**: username, email, password_hash, role

#### 2. `students`

- **Purpose**: Extended student profiles
- **Links to**: users table
- **Key Fields**: personal info, parent contact, booking history

#### 3. `drivers`

- **Purpose**: Driver profiles and vehicle information
- **Links to**: users table
- **Key Fields**: license, vehicle details, rating, trip count

#### 4. `shuttle_routes`

- **Purpose**: Available shuttle routes and schedules
- **Links to**: drivers table
- **Key Fields**: route details, pricing, seat availability

#### 5. `bookings`

- **Purpose**: Confirmed bookings (no cancellation fields)
- **Links to**: students, shuttle_routes
- **Key Fields**: seat selection, passenger details, total price
- **Status**: Only 'confirmed' or 'completed' (no cancelled status)

#### 6. `payments`

- **Purpose**: Payment tracking for bookings
- **Links to**: bookings table
- **Key Fields**: amount, payment method, transaction status

#### 7. `emergency_reports`

- **Purpose**: Emergency reporting system
- **Links to**: drivers, shuttle_routes
- **Key Fields**: emergency type, location, resolution status

#### 8. `route_tracking`

- **Purpose**: Real-time shuttle tracking
- **Links to**: bookings table
- **Key Fields**: current location, ETA, status updates

## Key Design Decisions

### No Cancellation Support

- **No cancelled_at fields**
- **No cancellation_reason fields**
- **No refund_status fields**
- **No cancellation policies**
- Bookings are final once confirmed

### Data Integrity

- **Foreign key constraints** ensure data consistency
- **Cascading deletes** maintain referential integrity
- **Unique constraints** prevent duplicate data

### Performance Optimizations

- **Indexes** on frequently queried fields
- **JSON storage** for seat selections
- **ENUM types** for status fields

## Usage Examples

### Creating a Booking

```sql
-- 1. Get student and route info
-- 2. Check seat availability
-- 3. Create booking record
INSERT INTO bookings (student_id, shuttle_route_id, selected_seats, passenger_name, passenger_email, passenger_phone, total_price)
VALUES (1, 5, '[3,4]', 'John Doe', 'john@student.edu', '+1234567890', 150.00);

-- 4. Update seat availability
UPDATE shuttle_routes SET available_seats = available_seats - 2 WHERE id = 5;

-- 5. Create payment record
INSERT INTO payments (booking_id, amount, payment_method, payment_status)
VALUES (LAST_INSERT_ID(), 150.00, 'online', 'completed');
```

### Checking Available Routes

```sql
SELECT * FROM shuttle_routes
WHERE is_active = TRUE
AND available_seats > 0
ORDER BY start_time;
```

### Student Booking History

```sql
SELECT b.*, sr.bus_number, sr.start_location, sr.end_location, sr.start_time
FROM bookings b
JOIN shuttle_routes sr ON b.shuttle_route_id = sr.id
WHERE b.student_id = 1
ORDER BY b.booking_date DESC;
```

## Setup Instructions

1. **Create Database**:

   ```sql
   CREATE DATABASE campus_shuttle;
   USE campus_shuttle;
   ```

2. **Run Schema**:

   ```bash
   mysql -u username -p campus_shuttle < database_schema.sql
   ```

3. **Insert Sample Data** (optional):
   - Uncomment and run the sample data insertions at the end of the schema file

## Security Considerations

- **Password hashing** is required (bcrypt recommended)
- **Input validation** should be implemented in application code
- **SQL injection prevention** through prepared statements
- **Role-based access control** should be enforced

## Future Extensions

If cancellation support is needed later, consider adding:

- `cancelled_at` timestamp field to bookings
- `cancellation_reason` table
- `refund_status` and `refund_amount` fields
- Audit trail for cancellations

## Notes

- All monetary values use DECIMAL(10,2) for precision
- Timestamps use UTC for consistency
- JSON fields allow flexible seat selection storage
- The schema supports multiple roles with proper separation</content>
  <parameter name="filePath">d:\Shuttle\campus-shuttle\DATABASE_README.md
