# Money Manager – Backend

A robust RESTful API backend for managing personal and business finances with comprehensive transaction tracking, user authentication, and advanced filtering capabilities.

## 🔗 Links

- **Frontend Repository**: [https://github.com/Harshit-Patle/money-manager-frontend](https://github.com/Harshit-Patle/money-manager-frontend)
- **Live Application**: [https://money-manager-frontend-six.vercel.app](https://money-manager-frontend-six.vercel.app)

## 📝 Description

The Money Manager backend is a Node.js/Express API that powers the Money Manager application. It provides secure authentication, transaction management, and data analytics endpoints with MongoDB as the database. The API is designed with RESTful principles and includes JWT-based authentication, data validation, and time-based business rules.

**Key Capabilities:**
- Secure user authentication with JWT tokens
- Transaction CRUD operations with validation
- Advanced filtering by date range, categories, and divisions
- Category-wise summary with aggregation pipelines
- Account transfer functionality with dual-entry bookkeeping
- Time-based edit restrictions (12-hour window)
- CORS-enabled for cross-origin requests

## ✨ Features

### Authentication & Security
- **User Registration**: Secure user signup with password hashing using bcrypt
- **User Login**: JWT-based authentication for secure session management
- **Protected Routes**: Middleware-based route protection requiring valid JWT tokens
- **Password Security**: Bcrypt hashing with salt rounds for enhanced security

### Transaction Management
- **Add Transactions**: Create income or expense transactions with detailed metadata
- **Retrieve Transactions**: Get all user transactions with sorting by creation date
- **Update Transactions**: Edit transactions within 12-hour window
- **Delete Transactions**: Remove transactions within 12-hour window
- **Time-Based Restrictions**: Automatic locking of transactions after 12 hours

### Advanced Filtering
- **Type Filter**: Filter by income or expense type
- **Category Filter**: Filter transactions by specific categories
- **Division Filter**: Separate Personal and Office transactions
- **Date Range Filter**: Filter transactions between any two dates (from/to)
- **Combined Filters**: Apply multiple filters simultaneously for precise queries

### Analytics & Reporting
- **Category Summary**: Aggregated income/expense totals grouped by category
- **MongoDB Aggregation**: Efficient data processing with aggregation pipelines
- **Date Range Analysis**: Optional filtering for historical analysis
- **Sorted Breakdown**: Category-wise data sorted alphabetically

### Account Management
- **Transfer Between Accounts**: Move funds between Cash/Bank/Wallet accounts
- **Dual-Entry Bookkeeping**: Expense from source, income to destination
- **Linked Transactions**: Unique transferId for tracking related transactions
- **Transfer Validation**: Prevents same-account transfers

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5.2
- **Database**: MongoDB with Mongoose 9.1
- **Authentication**: JSON Web Tokens (JWT) 9.0
- **Password Hashing**: bcryptjs 3.0
- **Environment Variables**: dotenv 17.2
- **CORS**: cors 2.8
- **Dev Tools**: nodemon 3.1

## 🔐 Environment Variables

The application requires the following environment variables:

```
PORT
MONGO_URI
JWT_SECRET
```

**Format**: The environment variables should be configured as follows:

**Example structure**:
```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_super_secret_jwt_key_here
```

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Harshit-Patle/money-manager-backend.git
   cd money-manager-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory and add:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`


## 🚀 Final Commit Hash

**Backend Final Implementation Commit**: `2c1f3be7a309cf04a57aa2cdb8143f1600382d9b`

> **Note**: Any commits after the above hash are documentation-only updates and do not affect the application's functionality. These commits may include README updates, comment additions, or other non-code documentation improvements.

## 📋 Submission Details

Complete submission information including the project description, live deployed URLs,
GitHub repository links, demo video link, and final commit hashes is provided in
`submission-details.txt` located in the root of this repository.

