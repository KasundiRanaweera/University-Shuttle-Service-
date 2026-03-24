CREATE DATABASE "CampusShuttleService";

-- Run the rest after connecting to the target database.

CREATE TABLE users ( user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, full_name VARCHAR(150) NOT NULL, username VARCHAR(50) NOT NULL UNIQUE, password_hash VARCHAR(255) NULL, email VARCHAR(100) NOT NULL UNIQUE, phone_no VARCHAR(15) NOT NULL, role VARCHAR(10) NOT NULL CHECK (role IN ('STUDENT','DRIVER','ADMIN')), status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() );

CREATE TABLE student ( user_id BIGINT PRIMARY KEY, university VARCHAR(100) NOT NULL, home_address VARCHAR(255) NOT NULL, parent_name VARCHAR(100) NOT NULL, parent_phone_no VARCHAR(15) NOT NULL, parent_email VARCHAR(100) NOT NULL, student_profile_photo VARCHAR(255),

CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE

);

CREATE TABLE driver ( user_id BIGINT PRIMARY KEY, license_no VARCHAR(50) NOT NULL UNIQUE, license_document VARCHAR(255) NOT NULL, vehicle_document VARCHAR(255) NOT NULL, vehicle_type VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('Bus','Minibus')), vehicle_number VARCHAR(30) NOT NULL UNIQUE, number_of_seats INT NOT NULL CHECK (number_of_seats > 0), driver_profile_photo VARCHAR(255),

CONSTRAINT fk_driver_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE

);

CREATE TABLE admin ( user_id BIGINT PRIMARY KEY, CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE );

CREATE TABLE shuttle_route ( shuttle_route_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, bus_number VARCHAR(20) NOT NULL UNIQUE, start_location VARCHAR(100) NOT NULL, end_location VARCHAR(100) NOT NULL, departure_time TIME NOT NULL, arrival_time TIME NOT NULL, duration_minutes INT NOT NULL CHECK (duration_minutes > 0), number_of_stops INT NOT NULL CHECK (number_of_stops >= 0), total_seats INT NOT NULL CHECK (total_seats > 0), price_per_seat NUMERIC(10,2) NOT NULL CHECK (price_per_seat >= 0), status VARCHAR(15) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','NotAvailable')), driver_id BIGINT NOT NULL, CONSTRAINT fk_route_driver FOREIGN KEY (driver_id) REFERENCES driver(user_id) ON DELETE RESTRICT );

CREATE TABLE booking ( booking_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, booking_date_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), trip_date DATE NOT NULL, selected_seats INT NOT NULL CHECK (selected_seats > 0 AND selected_seats <= 2), total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0), booking_status VARCHAR(15) NOT NULL DEFAULT 'CONFIRMED' CHECK (booking_status IN ('CONFIRMED','CANCELLED')), passenger_name VARCHAR(150) NOT NULL, passenger_email VARCHAR(100) NOT NULL, passenger_phone_no VARCHAR(15) NOT NULL, student_id BIGINT NOT NULL, shuttle_route_id BIGINT NOT NULL, CONSTRAINT fk_booking_student FOREIGN KEY (student_id) REFERENCES student(user_id) ON DELETE RESTRICT, CONSTRAINT fk_booking_route FOREIGN KEY (shuttle_route_id) REFERENCES shuttle_route(shuttle_route_id) ON DELETE RESTRICT );

CREATE TABLE booking_seat ( booking_seat_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, seat_number INT NOT NULL CHECK (seat_number > 0), booking_id BIGINT NOT NULL, shuttle_route_id BIGINT NOT NULL, trip_date DATE NOT NULL, CONSTRAINT fk_bookingseat_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE, CONSTRAINT fk_bookingseat_route FOREIGN KEY (shuttle_route_id) REFERENCES shuttle_route(shuttle_route_id) ON DELETE CASCADE, CONSTRAINT uq_seatbooking UNIQUE (shuttle_route_id, trip_date, seat_number) );

CREATE TABLE payment ( payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0), payment_method VARCHAR(20) NOT NULL DEFAULT 'ONLINE', payment_status VARCHAR(10) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID','FAILED')), booking_id BIGINT NOT NULL UNIQUE, CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE );

CREATE TABLE emergency_report ( emergency_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, emergency_type VARCHAR(30) NOT NULL CHECK (emergency_type IN ('TIRE_PUNCH','ENGINE_ISSUE','MEDICAL_EMERGENCY','ACCIDENT','OTHER')), location_name VARCHAR(100) NOT NULL, description VARCHAR(255), reported_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), status VARCHAR(15) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','RESOLVED')), resolved_time TIMESTAMP WITH TIME ZONE, driver_id BIGINT NOT NULL, shuttle_route_id BIGINT NOT NULL, resolved_by_admin_id BIGINT, CONSTRAINT fk_emergency_driver FOREIGN KEY (driver_id) REFERENCES driver(user_id) ON DELETE SET NULL, CONSTRAINT fk_emergency_route FOREIGN KEY (shuttle_route_id) REFERENCES shuttle_route(shuttle_route_id) ON DELETE SET NULL, CONSTRAINT fk_emergency_admin FOREIGN KEY (resolved_by_admin_id) REFERENCES admin(user_id) ON DELETE SET NULL );

CREATE TABLE live_tracking ( tracking_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90), longitude NUMERIC(10,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180), speed NUMERIC(5,2) CHECK (speed >= 0), tracking_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), trip_date DATE NOT NULL, shuttle_route_id BIGINT NOT NULL, driver_id BIGINT NOT NULL, CONSTRAINT fk_tracking_route FOREIGN KEY (shuttle_route_id) REFERENCES shuttle_route(shuttle_route_id) ON DELETE CASCADE, CONSTRAINT fk_tracking_driver FOREIGN KEY (driver_id) REFERENCES driver(user_id) ON DELETE CASCADE );

CREATE TABLE notification ( notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, message VARCHAR(255) NOT NULL, receiver_type VARCHAR(10) NOT NULL CHECK (receiver_type IN ('STUDENT','PARENT')), receiver_phone VARCHAR(15) NOT NULL, sent_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), status VARCHAR(15) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT','FAILED','PENDING')), booking_id BIGINT, student_id BIGINT NOT NULL, CONSTRAINT fk_notification_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE SET NULL, CONSTRAINT fk_notification_student FOREIGN KEY (student_id) REFERENCES student(user_id) ON DELETE CASCADE );

COMMIT;

ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;