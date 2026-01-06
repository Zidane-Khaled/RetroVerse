// This file simulates a backend API using LocalStorage
// In a real production app, this would be replaced by API calls to a Node/Python/Go server.

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

const STORAGE_KEY_USERS = 'retroverse_users';
const STORAGE_KEY_SESSION = 'retroverse_session';

// Helper to delay execution to simulate network latency
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 800));

export const authService = {
  // REGISTER
  async register(username: string, email: string, password: string): Promise<User> {
    await simulateNetworkDelay();

    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    
    // Check if user exists
    if (users.find((u: any) => u.username === username)) {
      throw new Error('USERNAME_TAKEN');
    }
    if (users.find((u: any) => u.email === email)) {
      throw new Error('EMAIL_REGISTERED');
    }

    // Create new user
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email,
      password, // Note: In a real app, NEVER store plain text passwords. Use bcrypt on the server.
      createdAt: Date.now(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    
    // Auto login after register
    const sessionUser = { id: newUser.id, username: newUser.username, email: newUser.email, createdAt: newUser.createdAt };
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionUser));
    
    return sessionUser;
  },

  // LOGIN
  async login(username: string, password: string): Promise<User> {
    await simulateNetworkDelay();

    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const user = users.find((u: any) => u.username === username);

    if (!user || user.password !== password) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const sessionUser = { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionUser));
    
    return sessionUser;
  },

  // LOGOUT
  logout() {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  },

  // GET CURRENT SESSION
  getCurrentUser(): User | null {
    const session = localStorage.getItem(STORAGE_KEY_SESSION);
    return session ? JSON.parse(session) : null;
  }
};