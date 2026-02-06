# PlaySpot - Sports Activities Booking and Event Management System  

## Project Overview

**PlaySpot** is a comprehensive sports facility booking and management platform that connects users with sports venues, enables facility managers to manage their properties, and provides administrators with tools to oversee the entire system.

### Key Objectives
- Provide a user-friendly platform for discovering and booking sports facilities
- Enable facility managers to list, manage, and verify their sports venues
- Support event creation and community building around sports activities
- Integrate with Google Calendar for automated reservation management
- Implement secure payment processing for reservations
- Facilitate user reviews and ratings for facilities

---

## Features

### User Features
- **User Registration & Authentication**
  - Email/password registration with email verification
  - Google OAuth integration for single sign-on
  - Password reset functionality
  - JWT-based authentication with refresh tokens
  - Multi-device session management

- **Facility Discovery**
  - Browse all available sports facilities
  - Advanced search and filtering (by city, sport, surface, environment, capacity)
  - View detailed facility information with images
  - Check real-time availability and pricing
  - View facility reviews and ratings

- **Booking System**
  - Book facilities with time slot selection
  - View booking history and upcoming reservations
  - Cancel reservations
  - Receive booking confirmations via email
  - Google Calendar integration for automatic event creation

- **Payment Processing**
  - Secure payment for reservations
  - Payment status tracking
  - Payment history

- **Event Management**
  - Create public sports events
  - Join existing events
  - View event details and participants
  - Manage own created events
  - Leave joined events

- **Review System**
  - Write reviews for facilities after confirmed reservations
  - Rate facilities (1-5 stars)
  - Edit or delete own reviews
  - View aggregated review statistics

### Manager Features
- **Sport Complex Management**
  - Create and manage sport complexes
  - Add multiple facilities to complexes
  - Upload and manage facility images
  - Set facility schedules and pricing
  - View pending verification status

- **Facility Management**
  - Create standalone facilities or add to sport complexes
  - Configure facility details (sport, surface, environment, capacity)
  - Set working hours and dynamic pricing
  - Manage facility images via Cloudinary integration
  - Update facility information
  - View facility bookings by month
  - Track reservation status and payment information

### Admin Features
- **Verification & Moderation**
  - Review pending facility submissions
  - Verify or reject facilities and sport complexes
  - Toggle facility/complex active status
  - Manage user roles

- **User Management**
  - View all registered users
  - Deactivate user accounts
  - Activate user accounts
  - Monitor user activity

---

## Technology Stack

### Backend
- **Language**: Go 1.25
- **Framework**: Gorilla Mux (HTTP routing)
- **Database**: PostgreSQL
- **Authentication**: JWT (golang-jwt/jwt/v5)
- **Password Hashing**: bcrypt (golang.org/x/crypto)
- **OAuth**: Google OAuth2 (golang.org/x/oauth2)
- **CORS**: rs/cors
- **Environment Management**: godotenv
- **Image Storage**: Cloudinary
- **Email**: SMTP integration
- **Calendar**: Google Calendar API

### Frontend
- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Routing**: React Router DOM 7.9.6
- **HTTP Client**: Axios 1.13.2
- **UI Components**: 
  - React DatePicker 9.1.0
  - FontAwesome (icons)
- **OAuth**: @react-oauth/google 0.13.4
- **Build Tool**: Vite 7.2.4
- **Linting**: ESLint 9.39.1

---

## Architecture

### System Architecture

PlaySpot follows a modern **three-tier architecture** with clear separation of concerns:

**1. Presentation Layer (Frontend - React)**
   - Built with React 19 and TypeScript for type safety
   - Organized into Pages (route components), reusable Components, Services (API communication), and Context (global state)
   - Communicates with backend via RESTful HTTP/JSON requests using Axios
   - Handles user interface, user interactions, and client-side state management
   - Implements Google OAuth integration for authentication
   - Manages routing and navigation using React Router

**2. Application Layer (Backend - Go)**
   - RESTful API server built with Go and Gorilla Mux router
   - Processes HTTP requests and returns JSON responses
   - Implements business logic and data validation
   - Handles authentication via JWT tokens
   - Integrates with external services (Google Calendar, Cloudinary, SMTP)
   - Enforces role-based access control (Admin, Manager, User)

**3. Data Layer (PostgreSQL Database)**
   - Relational database storing all application data
   - Contains 15+ tables with defined relationships and constraints
   - Handles data persistence, integrity, and transactions
   - Supports complex queries for search, filtering, and aggregation

**External Service Integrations:**
   - **Google Calendar API**: Automatic event creation for confirmed reservations
   - **Google OAuth 2.0**: Single sign-on authentication
   - **Cloudinary**: Cloud-based image storage and CDN for facility/complex photos
   - **SMTP Email Service**: Transactional emails (verification, password reset, booking confirmations)

**Communication Flow:**
   - User interacts with React frontend
   - Frontend sends HTTP requests to Go backend API
   - Backend processes requests through middleware (authentication, CORS)
   - Handlers receive requests and delegate to service layer
   - Services implement business logic and call repositories
   - Repositories execute database queries
   - External services are called when needed (email, images, calendar)
   - Responses flow back through the layers to the frontend
   - Frontend updates UI based on response data

### Backend Architecture Pattern
The backend follows a **layered architecture**:

1. **Handler Layer**: HTTP request handling and response formatting
2. **Service Layer**: Business logic implementation
3. **Repository Layer**: Data access and database operations
4. **Model Layer**: Data structures and entities
5. **Middleware Layer**: Cross-cutting concerns (auth, CORS, logging)


## API Endpoints

### Main User-Facing Endpoints

#### Authentication & Account Management
- **POST** `/api/register` - Register new user account
- **POST** `/api/login` - Login with email/password
- **POST** `/api/google-login` - Login with Google OAuth
- **POST** `/api/forgot-password` - Request password reset email
- **POST** `/api/reset-password` - Reset password with token
- **GET** `/api/verify-email` - Verify email address
- **GET** `/api/profile` - View user profile (Protected)
- **POST** `/api/change-password` - Change password (Protected)
- **POST** `/api/connect-google-calendar` - Connect Google Calendar integration (Protected)
- **GET** `/api/active-devices` - View active login sessions (Protected)
- **POST** `/api/logout-all` - Logout from all devices (Protected)

#### Browse Facilities & Sport Complexes
- **GET** `/api/facilities` - Browse all facilities
- **GET** `/api/facilities/search` - Search facilities with filters
- **GET** `/api/facilities/{id}` - View facility details
- **GET** `/api/sport-complexes` - Browse all sport complexes
- **GET** `/api/sport-complexes/{id}` - View sport complex details

#### Reservations & Bookings
- **POST** `/api/reservations` - Create new reservation (Protected)
- **GET** `/api/reservations/user` - View my booking history (Protected)
- **GET** `/api/reservations/upcoming` - View upcoming bookings (Protected)
- **POST** `/api/reservations/{id}/cancel` - Cancel reservation (Protected)
- **POST** `/api/reservations/{id}/pay` - Process payment for reservation (Protected)

#### Events & Community
- **GET** `/api/events` - Browse all public events
- **GET** `/api/events/{id}` - View event details
- **POST** `/api/events` - Create new event (Protected)
- **PUT** `/api/events/{id}` - Update event (Protected)
- **DELETE** `/api/events/{id}` - Delete event (Protected)
- **POST** `/api/events/{id}/join` - Join event (Protected)
- **POST** `/api/events/{id}/leave` - Leave event (Protected)
- **GET** `/api/users/me/events` - View my created events (Protected)
- **GET** `/api/users/me/events/joined` - View events I joined (Protected)

#### Reviews & Ratings
- **GET** `/api/facilities/{id}/reviews` - View facility reviews
- **POST** `/api/reviews` - Write a review (Protected)
- **PUT** `/api/reviews/{id}` - Update my review (Protected)
- **DELETE** `/api/reviews/{id}` - Delete my review (Protected)

#### Manager - Facility Management
- **GET** `/api/facilities/my` - View my facilities (Manager)
- **POST** `/api/facilities` - Create new facility (Manager)
- **PUT** `/api/facilities/{id}` - Update facility details (Manager)
- **GET** `/api/facilities/{id}/bookings` - View facility bookings (Manager)
- **GET** `/api/sport-complexes/my` - View my sport complexes (Manager)
- **POST** `/api/sport-complexes` - Create sport complex (Manager)

#### Admin - System Management
- **GET** `/api/admin/facilities/pending` - View pending facilities (Admin)
- **POST** `/api/admin/facilities/{id}/verify` - Verify facility (Admin)
- **POST** `/api/admin/facilities/{id}/toggle-status` - Activate/deactivate facility (Admin)
- **GET** `/api/admin/sport-complexes/pending` - View pending complexes (Admin)
- **POST** `/api/admin/sport-complexes/{id}/verify` - Verify sport complex (Admin)
- **POST** `/api/admin/sport-complexes/{id}/toggle-status` - Activate/deactivate complex (Admin)
- **GET** `/api/admin/users` - View all users (Admin)
- **POST** `/api/admin/users/deactivate` - Deactivate user (Admin)
- **POST** `/api/admin/users/activate` - Activate user (Admin)

---

## Authentication & Authorization

### JWT Token System
- **Access Token**: Short-lived (15 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), stored in database, used to obtain new access tokens
- **Token Storage**: Refresh tokens stored in database with user-agent tracking for multi-device support

### Token Types
1. **email_verification**: Email verification tokens (24 hours)
2. **password_reset**: Password reset tokens (1 hour)
3. **refresh**: Refresh tokens for authentication (7 days)
4. **google_access**: Google OAuth access tokens
5. **google_refresh**: Google OAuth refresh tokens

### Role-Based Access Control 
- **Admin** : Full system access, verification privileges
- **User** : Basic user access, booking privileges
- **Manager** : Facility management privileges

### Middleware
- **JWTAuthMiddleware**: Validates JWT tokens and extracts user information
- **AdminRoleMiddleware**: Ensures user has admin role for protected endpoints
- **CORS Middleware**: Handles cross-origin requests

---

## Frontend Structure

### Pages
- **Home.tsx**: Landing page with featured facilities
- **Login.tsx / Register.tsx**: Authentication pages
- **ForgotPassword.tsx / ResetPassword.tsx**: Password recovery flow
- **VerifyEmail.tsx**: Email verification handler
- **Profile.tsx**: User profile management
- **SportComplexes.tsx**: Browse sport complexes
- **SportComplexDetails.tsx**: Detailed complex view
- **Facilities.tsx**: Browse and search facilities
- **FacilityDetails.tsx**: Detailed facility view with booking
- **EditFacility.tsx**: Edit facility details
- **ManageFacilities.tsx**: Manager's facility dashboard
- **FacilityBookings.tsx**: View facility bookings by month
- **BecomeManager.tsx**: Manager registration wizard
- **AdminPanel.tsx**: Admin verification and user management dashboard
- **MyActivity.tsx**: User activity overview (bookings, events, reviews)
- **Events.tsx**: Browse public events
- **EventDetails.tsx**: Event details and participation
- **CreateEventForm.tsx / EditEventForm.tsx**: Event management

### Components
- **Navbar.tsx**: Navigation bar with auth state
- **FacilityCard.tsx**: Facility preview card
- **BookingModal.tsx**: Reservation creation modal
- **ImageUpload.tsx**: Cloudinary image upload component
- **ImageModal.tsx / ImageViewerModal.tsx**: Image viewing components
- **ReviewSection.tsx**: Review display and submission
- **WorkingHoursPricing.tsx**: Schedule and pricing management
- **CreateFacilityForm.tsx / CreateSportComplexForm.tsx**: Creation wizards
- **CreateFacilityWizard.tsx / CreateSportComplexWizard.tsx**: Multi-step creation wizards
- **AddFacilitySubForm.tsx**: Subform for adding facilities to complexes
- **AdminDetailModal.tsx**: Admin verification modal
- **PasswordInput.tsx**: Password input with visibility toggle
- **ProtectedRoute.tsx**: Route guard for authenticated users
- **PublicOnlyRoute.tsx**: Route guard for non-authenticated users
- **TestLoginHelper.tsx**: Development helper for quick testing

### Context
- **AuthContext.tsx**: Global authentication state management
  - User information
  - Login/logout functions
  - Token management
  - Google OAuth integration

### Services
- **api.ts**: Centralized Axios instance with interceptors
  - Automatic token attachment
  - Token refresh on 401 errors
  - Request/response error handling


## Backend Structure

### Handlers (HTTP Layer)
- **user_handler.go**: User authentication and profile management
- **facility_handler.go**: Facility CRUD operations
- **sport_complex_handler.go**: Sport complex management
- **reservation_handler.go**: Reservation creation and management
- **payment_handler.go**: Payment processing
- **event_handler.go**: Event management
- **review_handler.go**: Review operations
- **image_handler.go**: Image upload and retrieval

### Services (Business Logic Layer)
- **user_service.go**: User operations, authentication logic
- **facility_service.go**: Facility business rules
- **sport_complex_service.go**: Complex management logic
- **reservation_service.go**: Booking validation and conflict detection
- **payment_service.go**: Payment processing logic
- **event_service.go**: Event creation and participation logic
- **review_service.go**: Review validation and statistics
- **token_service.go**: JWT generation and validation
- **email_service.go**: Email sending (verification, notifications)
- **google_calendar_service.go**: Google Calendar API integration
- **image_service.go**: Image upload orchestration
- **storage/cloudinary.go**: Cloudinary integration
- **storage/storage.go**: Storage interface

### Repositories (Data Access Layer)
- **database.go**: Database connection and migration runner
- **user_repository.go**: User data access
- **facility_repository.go**: Facility data access
- **sport_complex_repository.go**: Complex data access
- **reservation_repository.go**: Reservation data access
- **payment_repository.go**: Payment data access
- **event_repository.go**: Event data access
- **review_repository.go**: Review data access
- **token_repository.go**: Token management
- **metadata_repository.go**: Sports, categories, surfaces, environments
- **image_repository.go**: Image data access

### Models
- **user.go**: User entity
- **facility.go**: Facility and FacilityDetails entities
- **sport_complex.go**: SportComplex entity
- **reservation.go**: Reservation and availability models
- **payment.go**: Payment entity
- **event.go**: Event entity
- **review.go**: Review entity
- **sport.go**: Sport, category, surface, environment models
- **image.go**: Image entity
- **token.go**: Token entity
- **user_auth_identity.go**: OAuth identity linking

### Middleware
- **auth_middleware.go**: JWT authentication and role-based authorization

### DTOs (Data Transfer Objects)
- **RegisterUserDTO.go**: User registration payload
- **LoginUserDTO.go**: Login credentials
- **GoogleLoginDTO.go**: Google OAuth payload
- **LinkGoogleAccountDTO.go**: Google account linking
- **ForgotPasswordDTO.go / ResetPasswordDTO.go**: Password recovery
- **ChangePasswordDTO.go**: Password change
- **CreateFacilityDTO.go**: Facility creation
- **CreateSportComplexDTO.go**: Complex creation
- **CreateReservationDTO.go**: Reservation creation
- **ProcessPaymentDTO.go**: Payment processing
- **CreateEventDTO.go / UpdateEventDTO.go**: Event management
- **ReviewDTO.go**: Review submission
- **ReservationWithFacilityDTO.go**: Enhanced reservation response
