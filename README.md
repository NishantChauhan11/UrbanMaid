# UrbanMaid – Real-Time Domestic Helper Hiring Platform

UrbanMaid is a web platform that connects households with domestic helpers such as maids, cooks, babysitters, cleaners, and electricians. The platform provides secure login, instant booking, real-time helper availability, and admin monitoring to ensure trust and reliability.

## ✨ Key Features

### For Users (Customers)
- Register and login securely
- Browse helpers by category and location
- View helper profiles (skills, experience, hourly rate, reviews)
- Book helpers instantly
- Check booking history
- Cancel bookings if needed

### For Helpers
- Register and manage profile (photo, skills, rate, city)
- Status updates automatically:
  - **Active** → Available
  - **Busy** → When booked
- View and manage bookings

### For Admin
- Login with admin privileges
- View and manage all Users and Helpers
- Delete any User or Helper if required
- Monitor helper real-time status (Active / Busy)

## 🔁 Booking Flow
1. User selects helper and confirms booking  
2. Helper status changes from **Active → Busy**  
3. After completion or cancellation, status returns to **Active**  
4. Prevents double-booking and ensures accuracy

## 🛠 Technology Used
- **Frontend:** HTML, CSS, EJS, Bootstrap
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** bcryptjs + express-session
- **Image Handling:** Multer + ImageKit
- **Deployment:** Render / GitHub

## 🔐 Security
- Passwords are stored using hashing (bcryptjs)
- Session-based authentication
- Role-based access (User / Helper / Admin)
- Protected routes to prevent unauthorized access

## 🎯 Objective
To provide a transparent, secure, and easy-to-use platform that modernizes domestic helper hiring and builds trust between households and helpers.

## 👨‍🏫 Academic Details
**GLA University, Mathura**  
Department of Computer Science & Engineering  
Mentor: *Mr. Jay Pratap Singh*

## 👥 Team Members
- **Anurag Sharma**  
- **Gopal Sharma**
- **Nishant Chauhan**  

---

