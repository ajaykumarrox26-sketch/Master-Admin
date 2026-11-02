import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase';

const STORAGE_KEY = 'gsk-phone-user';

function firebasePhoneError(err: unknown): Error {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-phone-number': 'The phone number is invalid. Please include the country code (e.g. +91).',
    'auth/missing-phone-number': 'Please enter a phone number.',
    'auth/too-many-requests': 'Too many OTP requests. Please try again later.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/captcha-check-failed': 'Security verification failed. Please refresh and try again.',
    'auth/invalid-verification-code': 'The OTP code is incorrect. Please try again.',
    'auth/code-expired': 'The OTP code has expired. Please request a new one.',
    'auth/credential-too-old-login-request': 'Your session has expired. Please request a new OTP.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/operation-not-allowed': 'Phone authentication is not enabled in your Firebase project.',
    'auth/app-not-authorized': 'This domain is not authorized in Firebase. Add it to the authorized domains list.',
  };
  const msg = map[code];
  if (msg) return new Error(msg);
  return err instanceof Error ? err : new Error('An unexpected error occurred. Please try again.');
}

interface StoredUser {
  uid: string;
  phoneNumber: string;
}

export type PhoneAuthStatus = 'loading' | 'signed_out' | 'otp_sent' | 'authenticated';

interface PhoneAuthContextValue {
  status: PhoneAuthStatus;
  phoneNumber: string | null;
  firebaseUser: User | null;
  isConfigured: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  signOut: () => Promise<void>;
  resetOtp: () => void;
}

const PhoneAuthContext = createContext<PhoneAuthContextValue | null>(null);

function loadStoredUser(): StoredUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function saveStoredUser(user: StoredUser) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearStoredUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function PhoneAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PhoneAuthStatus>('loading');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const lastPhoneRef = useRef<string>('');
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      const stored = loadStoredUser();
      if (stored) {
        setPhoneNumber(stored.phoneNumber);
        setStatus('authenticated');
      } else {
        setStatus('signed_out');
      }
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setPhoneNumber(user.phoneNumber);
        saveStoredUser({ uid: user.uid, phoneNumber: user.phoneNumber ?? '' });
        setStatus('authenticated');
      } else {
        const stored = loadStoredUser();
        if (stored) {
          setPhoneNumber(stored.phoneNumber);
          setStatus('authenticated');
        } else {
          setFirebaseUser(null);
          setPhoneNumber(null);
          setStatus('signed_out');
        }
      }
    });

    return () => unsub();
  }, []);

  const getRecaptcha = useCallback((): RecaptchaVerifier => {
    if (!auth) throw new Error('Firebase is not configured');
    if (!recaptchaRef.current) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {},
        'expired-callback': () => {
          recaptchaRef.current = null;
        },
      });
      verifier.render();
      recaptchaRef.current = verifier as unknown as RecaptchaVerifier;
    }
    return recaptchaRef.current;
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    if (!auth) throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys to your .env file.');
    const normalized = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
    lastPhoneRef.current = normalized;
    try {
      const verifier = getRecaptcha();
      const result = await signInWithPhoneNumber(auth, normalized, verifier);
      confirmationRef.current = result;
      setPhoneNumber(normalized);
      setStatus('otp_sent');
    } catch (err) {
      recaptchaRef.current = null;
      throw firebasePhoneError(err);
    }
  }, [getRecaptcha]);

  const verifyOtp = useCallback(async (code: string) => {
    const confirmation = confirmationRef.current;
    if (!confirmation) throw new Error('No OTP was sent. Please request a new code.');
    try {
      const result = await confirmation.confirm(code);
      const user = result.user;
      setFirebaseUser(user);
      setPhoneNumber(user.phoneNumber);
      saveStoredUser({ uid: user.uid, phoneNumber: user.phoneNumber ?? '' });
      setStatus('authenticated');
    } catch (err) {
      throw firebasePhoneError(err);
    }
  }, []);

  const resendOtp = useCallback(async () => {
    if (!lastPhoneRef.current) throw new Error('No phone number to resend to.');
    confirmationRef.current = null;
    await sendOtp(lastPhoneRef.current);
  }, [sendOtp]);

  const signOut = useCallback(async () => {
    if (auth && firebaseUser) {
      await auth.signOut();
    }
    setFirebaseUser(null);
    setPhoneNumber(null);
    confirmationRef.current = null;
    clearStoredUser();
    setStatus('signed_out');
  }, [firebaseUser]);

  const resetOtp = useCallback(() => {
    confirmationRef.current = null;
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch { /* noop */ }
      recaptchaRef.current = null;
    }
    setStatus('signed_out');
    setPhoneNumber(null);
  }, []);

  const value = useMemo<PhoneAuthContextValue>(
    () => ({
      status,
      phoneNumber,
      firebaseUser,
      isConfigured: firebaseConfigured,
      sendOtp,
      verifyOtp,
      resendOtp,
      signOut,
      resetOtp,
    }),
    [status, phoneNumber, firebaseUser, sendOtp, verifyOtp, resendOtp, signOut, resetOtp],
  );

  return <PhoneAuthContext.Provider value={value}>{children}</PhoneAuthContext.Provider>;
}

export function usePhoneAuth() {
  const ctx = useContext(PhoneAuthContext);
  if (!ctx) throw new Error('usePhoneAuth must be used inside PhoneAuthProvider');
  return ctx;
}
