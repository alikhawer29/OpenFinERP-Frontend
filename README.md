# Check AxiosConfig

# Authentication Flow Documentation

Overview

This app uses React Query for API calls and Zustand for client-side state management. The login flow leverages React Query to handle the login request and Zustand to store the authenticated user's data persistently in the app state and localStorage.
Flow
Login Request with React Query
A custom hook, useLogin, is created using React Query’s useMutation to handle the login API request.
loginUser function makes the login request to the server, sending user credentials and returning user data (e.g., { role: "admin", ...otherData }) on success.

    Store User Data with Zustand
        If the login is successful, React Query's onSuccess callback calls setUser from userStore.
        setUser saves the user data in the Zustand userStore, which persists it in localStorage automatically using the persist middleware.

    Accessing User Data in the App
        Components use userStore to access user data and role across the app.
        This allows role-based access and authentication checks (e.g., determining isAuthenticated by checking if user exists).

Key Files

    useLogin.js: Contains useLogin hook with React Query’s mutation setup.
    userStore.js: Zustand store for managing user data with persist for session persistence.

This setup keeps the user logged in across sessions and allows easy access to user and role data throughout the app.
