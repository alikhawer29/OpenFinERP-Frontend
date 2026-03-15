# OpenFinERP Frontend

Modern React-based frontend application for the OpenFinERP Accounting & Management System.

Developed by Khawer Ali

## Project Overview

OpenFinERP Frontend is a comprehensive, responsive web application built with React 18 that serves as the user interface for the ERP Accounting & Management System. It provides a seamless experience for managing accounting operations, financial transactions, and business processes with role-based access control and real-time data synchronization.

## Key Features

### Modern UI/UX
- **Responsive Design**: Mobile-first approach with Bootstrap 5.3.3
- **Dark/Light Theme**: Customizable themes with ThemeStore
- **Loading States**: Skeleton loaders and spinners for better UX
- **Toast Notifications**: Real-time feedback with React Toastify

### Architecture
- **Component-Based**: Modular, reusable React components
- **State Management**: Zustand for global state management
- **Data Fetching**: TanStack Query for server state management
- **Routing**: React Router v6 with lazy loading
- **Form Handling**: Formik with Yup validation

### Authentication & Security
- **Token-Based Auth**: Integration with Laravel Sanctum
- **Role-Based Access**: Admin, User, and Employee roles
- **Protected Routes**: Route guards for different user types
- **Session Management**: Automatic token refresh and logout

### Core Modules
- **Dashboard**: Real-time analytics and charts
- **Masters**: Warehouse, Currency, Classification, Chart of Accounts
- **Transactions**: Vouchers, Payments, Banking operations
- **Reports**: Financial statements, Account reports, Budgeting
- **Administration**: User management, Branch settings, Subscriptions

## Tech Stack

| Area | Technology |
|------|------------|
| **Frontend Framework** | React 18.3.1 |
| **Build Tool** | Vite 5.4.10 |
| **Styling** | Bootstrap 5.3.3 + Custom CSS |
| **State Management** | Zustand 5.0.1 |
| **Data Fetching** | TanStack Query 5.59.16 |
| **Routing** | React Router DOM 6.27.0 |
| **Forms** | Formik 2.4.6 + Yup 1.4.0 |
| **HTTP Client** | Axios 1.7.7 |
| **Charts** | React Chart.js 2 5.2.0 |
| **Icons** | React Icons 5.3.0 |
| **Notifications** | React Toastify 10.0.6 |
| **Loading** | React Loading Skeleton 3.5.0 |
| **Pagination** | React Paginate 8.2.0 |

## Project Structure

```
src/
├── Components/           # Reusable UI components
├── Config/              # Configuration files
├── HOC/                 # Higher-Order Components
├── Hooks/               # Custom React hooks
├── Layout/              # Layout components
├── Mocks/               # Mock data for development
├── Router/              # Route configurations
├── Screens/             # Page components (294 screens)
│   ├── Administration/  # Admin management screens
│   ├── Dashboard/       # Dashboard screens
│   ├── Masters/         # Master data management
│   ├── Process/         # Business process screens
│   ├── Reports/         # Report generation screens
│   ├── Settings/        # Application settings
│   ├── Support/         # Help and support
│   ├── Transaction/     # Financial transaction screens
│   └── Unlock/          # Unlock request screens
├── Services/            # API service layers
├── Stores/              # Zustand state stores
├── Utils/               # Utility functions
└── assets/              # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API server running

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alikhawer29/OpenFinERP-Frontend.git
   cd OpenFinERP-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_APP_NAME=OpenFinERP
   VITE_APP_VERSION=1.0.0
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## Configuration

### API Configuration
Update the API base URL in `src/Config/api.js` or environment variables.

### Theme Configuration
Customize themes in `src/Stores/ThemeStore.js`.

### Route Configuration
Routes are defined in `src/App.jsx` and protected via `src/Router/PublicRoutes.jsx`.

## Features Overview

### Dashboard
- Real-time financial metrics
- Interactive charts and graphs
- Quick access to common operations
- User-specific data based on role

### Masters Management
- **Chart of Accounts**: Complete account hierarchy
- **Currency Management**: Multi-currency support
- **Warehouse Management**: Location-based inventory
- **Classification**: Business categorization
- **Party Ledger**: Customer and supplier management

### Transactions
- **Payment Vouchers**: Record payments
- **Receipt Vouchers**: Record receipts
- **Journal Vouchers**: General journal entries
- **Bank Transactions**: Bank reconciliation
- **Currency Transfer**: Foreign exchange operations
- **Remittance**: Outward/inward transfers

### Reports
- **Financial Reports**: Balance Sheet, P&L, Trial Balance
- **Account Reports**: Statement of Accounts, Outstanding Balances
- **Budgeting Reports**: Budget vs Actual analysis
- **Remittance Reports**: Currency transfer tracking

### Administration
- **User Management**: Create and manage users
- **Branch Management**: Multi-branch support
- **Subscription Management**: Package and plan management
- **Support**: Help and feedback system

## Authentication Flow

This app uses React Query for API calls and Zustand for client-side state management. The login flow leverages React Query to handle the login request and Zustand to store the authenticated user's data persistently in the app state and localStorage.

### Flow
1. **Login Request with React Query**
   - A custom hook, useLogin, is created using React Query's useMutation to handle the login API request.
   - loginUser function makes the login request to the server, sending user credentials and returning user data (e.g., { role: "admin", ...otherData }) on success.

2. **Store User Data with Zustand**
   - If the login is successful, React Query's onSuccess callback calls setUser from userStore.
   - setUser saves the user data in the Zustand userStore, which persists it in localStorage automatically using the persist middleware.

3. **Accessing User Data in the App**
   - Components use userStore to access user data and role across the app.
   - This allows role-based access and authentication checks (e.g., determining isAuthenticated by checking if user exists).

### Key Files
- **useLogin.js**: Contains useLogin hook with React Query's mutation setup.
- **userStore.js**: Zustand store for managing user data with persist for session persistence.

This setup keeps the user logged in across sessions and allows easy access to user and role data throughout the app.

## UI Components

### Common Components
- **CustomModal**: Reusable modal component
- **DataTable**: Data table with pagination
- **FormComponents**: Standardized form inputs
- **LoadingStates**: Skeleton loaders and spinners
- **Toast**: Notification system

### Layout Components
- **AppLayout**: Main application layout
- **ReportsLayout**: Layout for report screens
- **Sidebar**: Navigation menu
- **Header**: Top navigation bar

## State Management

### Stores
- **UserStore**: User authentication and profile
- **SettingsStore**: Application settings
- **ThemeStore**: Theme preferences
- **FormStore**: Form state management

### Data Fetching
- **TanStack Query**: Server state management
- **Axios Interceptors**: Request/response handling
- **Error Handling**: Centralized error management

## API Integration

### Service Layer
- **Services/**: API service classes for each module
- **Consistent Patterns**: Standardized API calls
- **Error Handling**: Automatic error reporting
- **Loading States**: Built-in loading indicators

### Endpoints
- **386 User Endpoints**: Complete business operations
- **38 Admin Endpoints**: Administrative functions
- **16 Public Endpoints**: Public utilities

## Development

### Code Quality
- **ESLint**: Code linting and formatting
- **React Best Practices**: Hooks, functional components
- **Component Reusability**: Modular design
- **Performance**: Lazy loading and optimization

### Testing
- **Component Testing**: React components
- **API Testing**: Service layer
- **Integration Testing**: User flows

## Deployment

### Build Process
```bash
npm run build
```

### Production Configuration
- **Base URL**: Configured in `vite.config.js`
- **Environment Variables**: Production-specific settings
- **Asset Optimization**: Automatic minification

### Deployment Options
- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **Server Hosting**: Nginx, Apache
- **Docker**: Containerized deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Related Projects

- **Backend**: [OpenFinERP Backend](https://github.com/alikhawer29/OpenFinERP)
- **API Documentation**: Available in the backend repository

---


**Note**: This frontend is designed to work with the OpenFinERP Laravel backend. Ensure the backend API is properly configured and running before starting the frontend application.
