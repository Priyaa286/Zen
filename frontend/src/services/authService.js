import {
  apiClient,
  API_ENDPOINTS,
  ApiServiceError,
  BACKEND_CAPABILITIES,
  isMockApiEnabled,
  normalizeApiError,
  simulateMockLatency,
} from './api';
import { normalizeUser } from './adapters';
import {
  mockForgotPassword,
  mockGetCurrentUser,
  mockLogin,
  mockLogout,
  mockRegister,
} from '@/mocks';

function assertBackendAuthSupported() {
  if (!BACKEND_CAPABILITIES.authImplemented) {
    throw new ApiServiceError(
      'Authentication endpoints (/api/auth/*) are not yet deployed on the FastAPI backend. Browse as a guest in Live mode, or switch to Mock Preview mode in the top bar to test full authentication and saved personalization.',
      {
        status: 501,
        code: 'BACKEND_AUTH_UNAVAILABLE',
      }
    );
  }
}

export async function loginWithEmail({ email, password, rememberMe = true }) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(360);
    try {
      const user = await mockLogin({ email, password, rememberMe });
      return normalizeUser(user, 'mock');
    } catch (err) {
      throw new ApiServiceError(err.message || 'Invalid credentials.', {
        status: err.status || 401,
        code: 'INVALID_CREDENTIALS',
      });
    }
  }

  assertBackendAuthSupported();

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, {
      email: String(email || '').trim().toLowerCase(),
      password,
      remember_me: Boolean(rememberMe),
    });
    const rawUser = data?.user ?? data;
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('zen_auth_token', data.token);
    }
    return normalizeUser(rawUser, 'live');
  } catch (err) {
    throw normalizeApiError(err, 'Unable to sign in right now.');
  }
}

export async function registerUser({
  fullName,
  email,
  password,
  residenceCountry = 'IN',
  preferredCurrency = 'INR',
}) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(420);
    try {
      const user = await mockRegister({
        fullName,
        email,
        password,
        residenceCountry,
        preferredCurrency,
      });
      return normalizeUser(user, 'mock');
    } catch (err) {
      throw new ApiServiceError(err.message || 'Could not create account.', {
        status: err.status || 400,
        code: 'REGISTRATION_ERROR',
      });
    }
  }

  assertBackendAuthSupported();

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, {
      full_name: String(fullName || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      password,
      residence_country: String(residenceCountry || 'IN').toUpperCase(),
      preferred_currency: String(preferredCurrency || 'INR').toUpperCase(),
    });
    const rawUser = data?.user ?? data;
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('zen_auth_token', data.token);
    }
    return normalizeUser(rawUser, 'live');
  } catch (err) {
    throw normalizeApiError(err, 'Unable to create your account right now.');
  }
}

export async function logoutUser() {
  if (isMockApiEnabled()) {
    await simulateMockLatency(140);
    return mockLogout();
  }

  if (!BACKEND_CAPABILITIES.authImplemented) {
    return { ok: true };
  }

  try {
    await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
    return { ok: true };
  } catch (err) {
    throw normalizeApiError(err, 'Logout failed.');
  }
}

export async function getCurrentUser() {
  if (isMockApiEnabled()) {
    const user = await mockGetCurrentUser();
    return user ? normalizeUser(user, 'mock') : null;
  }

  if (!BACKEND_CAPABILITIES.authImplemented) {
    return null;
  }

  try {
    const { data } = await apiClient.get(API_ENDPOINTS.AUTH_ME);
    const rawUser = data?.user ?? data;
    return rawUser ? normalizeUser(rawUser, 'live') : null;
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      return null;
    }
    throw err;
  }
}

export async function requestPasswordReset({ email }) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(320);
    return mockForgotPassword({ email });
  }

  assertBackendAuthSupported();

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, {
      email: String(email || '').trim().toLowerCase(),
    });
    return {
      accepted: true,
      message:
        data?.message ||
        'If an account exists for that email, password reset instructions have been sent.',
    };
  } catch (err) {
    throw normalizeApiError(err, 'Unable to submit password reset request.');
  }
}

