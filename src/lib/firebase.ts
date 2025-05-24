// Firebase functionality disabled - using stub functions during migration

// Mock types to maintain compatibility
export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}

// Stub functions to prevent errors during Firebase migration
const signInWithToken = async (token: string) => {
  console.warn("Firebase disabled: signInWithToken called");
  throw new Error("Firebase functionality has been disabled");
};

const getUserData = async (uid: string) => {
  console.warn("Firebase disabled: getUserData called");
  return null;
};

const updateUserData = async (uid: string, data: any) => {
  console.warn("Firebase disabled: updateUserData called with:", { uid, data });
  return true; // Return success to prevent errors
};

const signOut = async () => {
  console.warn("Firebase disabled: signOut called");
  return;
};

const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.warn("Firebase disabled: onAuthStateChange called");
  return () => {}; // Return empty unsubscribe function
};

const authenticateLineUser = async (params: any) => {
  console.warn("Firebase disabled: authenticateLineUser called");
  throw new Error("Firebase functionality has been disabled");
};

// Mock auth object
const auth = {
  currentUser: null,
};

// Mock db object
const db = null;

export {
  auth,
  db,
  signInWithToken,
  signOut,
  onAuthStateChange,
  getUserData,
  updateUserData,
  authenticateLineUser,
};
