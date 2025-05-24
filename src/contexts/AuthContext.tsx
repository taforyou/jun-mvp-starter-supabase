"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  authenticateLineUser,
  signInWithCredentials,
  getUserProfile,
  signOut as supabaseSignOut,
  onAuthStateChange,
  type UserProfile,
} from "@/lib/supabase";
import liff, { type Liff } from "@line/liff";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * Represents the different authentication states of the user with Supabase
 *
 * @property idle - No authentication activity is happening (either success or no user)
 * @property authenticating - User is being authenticated with LINE
 * @property fetchingProfile - Fetching user data from Supabase
 * @property signingOut - User is being signed out
 */
type AuthStatus = "idle" | "authenticating" | "fetchingProfile" | "error";

/**
 * Represents the different states of LIFF initialization
 *
 * @property initializing - LIFF is being initialized
 * @property success - LIFF has been successfully initialized (applied for logged in or logged out)
 * @property error - LIFF initialization failed
 */
type LiffState = "initializing" | "success" | "error";

// Define the shape of the auth context
type AuthContextType = {
  isNewUser: boolean;
  login: () => void;
  logout: () => Promise<void>;
  shouldShowLogin: boolean;
  isLineAuthenticating: boolean;
} & ReturnType<typeof useObserveSupabaseUser> &
  ReturnType<typeof useLineLogin>;

// Define the shape of the LINE profile
type LineProfile = Awaited<ReturnType<Liff["getProfile"]>>;

// Create the auth context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function useLineLogin() {
  const [liffState, setLiffState] = useState<LiffState>("initializing");
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);

  // Initialize LIFF
  useEffect(() => {
    const init = async () => {
      try {
        const LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID!;
        if (process.env.NODE_ENV === "development") {
          if (!LIFF_ID) {
            console.error("LIFF_ID should not be empty!");
          }
        }
        await liff.init({ liffId: LIFF_ID });
        setLiffState("success");
        if (liff.isLoggedIn()) {
          try {
            const profile = await liff.getProfile();
            setLineProfile(profile);
          } catch { }
        }
      } catch {
        setLiffState("error");
      }
    };

    init();
  }, []);

  return { liffState, lineProfile, setLineProfile };
}

function useObserveSupabaseUser(enabled: boolean) {
  const [authUser, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("authenticating");

  // Listen for Supabase auth state changes
  useEffect(() => {
    if (enabled) {
      const subscription = onAuthStateChange(async (user) => {
        setUser(user);

        if (user && liff.isLoggedIn()) {
          // Fetch user data from Supabase
          setAuthStatus("fetchingProfile");
          const userData = await getUserProfile(user.id);
          setUserProfile(userData);
        }

        setAuthStatus("idle");
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [enabled]);

  return {
    authUser,
    userProfile,
    setUserProfile,
    authStatus,
    setAuthStatus,
  };
}

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNewUser, setIsNewUser] = useState(false);
  const { liffState, lineProfile, setLineProfile } = useLineLogin();
  const { authUser, userProfile, setUserProfile, authStatus, setAuthStatus } =
    useObserveSupabaseUser(liffState === "success");

  // Check if we're in the LINE redirect process
  const isLineRedirect =
    searchParams?.has("liffRedirectUri") || searchParams?.has("code");

  // Login with LINE
  const login = useCallback(() => {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  }, []);

  // Logout from both Supabase and LINE
  const logout = useCallback(async () => {
    try {
      await supabaseSignOut();

      if (liff.isLoggedIn()) {
        liff.logout();
        // Use Next.js router instead of window.location
        router.refresh();
      }

      setLineProfile(null);
      setUserProfile(null);
    } catch { }
  }, [router, setLineProfile, setUserProfile]);

  // Check if LINE login is completed but Supabase auth is not
  useEffect(() => {
    // Only proceed after LIFF redirect and no user from Supabase auth,
    if (
      isLineRedirect &&
      liffState === "success" &&
      liff.isLoggedIn() &&
      authStatus === "idle" &&
      !authUser
    ) {
      async function authenticateWithLine() {
        try {
          setAuthStatus("authenticating");

          // Try to get LINE ID token first, fallback to access token
          let token = null;
          let tokenType: "id" | "access" = "id";

          if (liff.isLoggedIn()) {
            token = liff.getIDToken();
            console.log("LINE ID token:", token ? "Present" : "Not available");

            if (!token) {
              // Fallback to access token if ID token is not available
              token = liff.getAccessToken();
              tokenType = "access";
              console.log("Using LINE access token as fallback");
              console.log("LINE access token:", token ? "Present" : "Not available");
            }
          }

          if (!token) {
            console.error("No LINE token available (neither ID nor access token)");
            setAuthStatus("error");
            return;
          }

          console.log("Sending to Supabase Edge Function:", { tokenType, tokenPresent: !!token });

          // Call Supabase Edge Function to authenticate with LINE
          const {
            sessionData: { email, password },
            isNewUser: newUser,
            userData,
          } = await authenticateLineUser({
            token,
            tokenType
          });

          console.log("Edge Function response:", { emailPresent: !!email, passwordPresent: !!password, isNewUser: newUser });

          if (newUser) {
            setIsNewUser(newUser);
          }

          // Sign in to Supabase with email and password
          // If success, fetching user profile will be handled by Supabase user hook
          await signInWithCredentials(email, password);

          // Clean up query parameters after successful authentication
          router.replace(pathname);
        } catch (error) {
          console.error("Authentication error:", error);
          setAuthStatus("error");
        }
      }

      authenticateWithLine();
    }
  }, [
    liffState,
    authUser,
    router,
    pathname,
    isLineRedirect,
    authStatus,
    setAuthStatus,
  ]);

  return (
    <AuthContext.Provider
      value={{
        liffState,
        lineProfile,
        authUser,
        authStatus,
        userProfile,
        isNewUser,
        setAuthStatus,
        setLineProfile,
        setUserProfile,
        login,
        logout,
        isLineAuthenticating:
          authStatus === "authenticating" && !authUser && isLineRedirect,
        shouldShowLogin:
          authStatus === "idle" &&
          liffState === "success" &&
          !liff.isLoggedIn(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
