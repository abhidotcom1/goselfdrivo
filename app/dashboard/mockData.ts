export const MOCK_CARS_V2 = [
    {
        id: 'car-1',
        name: 'Tesla Model 3 Performance',
        car_number: 'KA-01-EV-2023',
        image_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        fuel_type: 'ELECTRIC',
        transmission: 'AUTOMATIC',
        seats: 5,
        hourly_rate: 25,
        min_booking_hours: 4,
        status: 'AVAILABLE'
    },
    {
        id: 'car-2',
        name: 'Mercedes-Benz C-Class',
        car_number: 'KA-05-PREM-5555',
        image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        fuel_type: 'PETROL',
        transmission: 'AUTOMATIC',
        seats: 5,
        hourly_rate: 35,
        min_booking_hours: 6,
        status: 'LOCKED' // Manually locked by admin
    },
    {
        id: 'car-3',
        name: 'Porsche 911 Carrera',
        car_number: 'KA-53-Z-911',
        image_url: 'https://images.unsplash.com/photo-1503376763036-066120622c74?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        fuel_type: 'PETROL',
        transmission: 'AUTOMATIC',
        seats: 2,
        hourly_rate: 85,
        min_booking_hours: 2,
        status: 'MAINTENANCE'
    },
    {
        id: 'car-4',
        name: 'Toyota Innova Crysta',
        car_number: 'KA-02-D-7788',
        image_url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        fuel_type: 'DIESEL',
        transmission: 'MANUAL',
        seats: 7,
        hourly_rate: 18,
        min_booking_hours: 12,
        status: 'ON_TRIP'
    },
    {
        id: 'car-5',
        name: 'Hyundai Creta',
        car_number: 'KA-03-M-1122',
        image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        fuel_type: 'PETROL',
        transmission: 'MANUAL',
        seats: 5,
        hourly_rate: 15,
        min_booking_hours: 6,
        status: 'AVAILABLE'
    }
]

export const MOCK_BOOKINGS_V2 = [
    {
        id: 'bk-1',
        user: { name: 'Rahul Sharma', phone: '+91 9988776655' },
        car: { name: 'Toyota Innova Crysta', car_number: 'KA-02-D-7788' },
        pickup_time: '2025-02-26T09:00:00Z',
        drop_time: '2025-02-27T09:00:00Z',
        expected_return_time: '2025-02-27T09:00:00Z',
        total_amount: 432,
        due_amount: 432,
        status: 'ON_TRIP'
    },
    {
        id: 'bk-2',
        user: { name: 'Priya Singh', phone: '+91 9876543210' },
        car: { name: 'Tesla Model 3', car_number: 'KA-01-EV-2023' },
        pickup_time: '2025-02-28T10:00:00Z',
        drop_time: '2025-02-28T14:00:00Z',
        total_amount: 100,
        due_amount: 0,
        status: 'PENDING'
    },
    {
        id: 'bk-3',
        user: { name: 'Arun Kumar', phone: '+91 8899776655' },
        car: { name: 'Mercedes-Benz C-Class', car_number: 'KA-05-PREM-5555' },
        pickup_time: '2025-02-20T08:00:00Z',
        drop_time: '2025-02-20T18:00:00Z',
        total_amount: 350,
        due_amount: 0,
        status: 'COMPLETED'
    },
    {
        id: 'bk-4',
        user: { name: 'Late user', phone: '+91 7776665555' },
        car: { name: 'Porsche 911', car_number: 'KA-53-Z-911' },
        pickup_time: '2025-02-25T10:00:00Z',
        drop_time: '2025-02-25T12:00:00Z',
        expected_return_time: '2025-02-25T12:00:00Z', // Currently past due
        total_amount: 170,
        due_amount: 50,
        status: 'LATE'
    }
]

export const MOCK_STATS_V2 = [
    { name: 'Total Revenue', value: '$12,450', change: '+12%', type: 'positive' },
    { name: 'Active Trips', value: '4', change: 'Live', type: 'neutral' },
    { name: 'Pending Approvals', value: '2', change: 'Action Req', type: 'warning' },
    { name: 'Late Returns', value: '1', change: 'Critical', type: 'negative' },
]
