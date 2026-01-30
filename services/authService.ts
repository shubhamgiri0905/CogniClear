import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';

const USERS_STORAGE_KEY = 'cogniclear_users_db';

interface StoredUser extends User {
  passwordHash: string; // In a real app, never store plain text. We'll simulate hash storage.
}

const getAllUsers = (): StoredUser[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

const saveUser = (user: StoredUser) => {
  const users = getAllUsers();
  users.push(user);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authService = {
  signUp: async (name: string, email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const users = getAllUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("User with this email already exists.");
    }

    const newUser: StoredUser = {
      id: uuidv4(),
      name,
      email,
      passwordHash: btoa(password) // Simple base64 for mock "hashing"
    };

    saveUser(newUser);

    // Return sanitized user
    const { passwordHash, ...user } = newUser;
    return user;
  },

  signIn: async (email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const users = getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    if (user.passwordHash !== btoa(password)) {
      throw new Error("Invalid email or password.");
    }

    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
};