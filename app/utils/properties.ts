/**
 * Centralized Configuration and Constants
 * This file serves as a single source of truth for all configuration values,
 * routes, messages, and UI constants.
 */

// ============================================================================
// ENVIRONMENT & API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  /**
   * Base URL for all API requests
   * Loaded from NEXT_PUBLIC_API_BASE_URL environment variable
   */
  baseUrl: (() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) throw new Error("Missing required environment variable: NEXT_PUBLIC_API_BASE_URL");
    return url;
  })(),

  /**
   * Request timeout in milliseconds
   */
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),

  /**
   * Enable detailed logging for debugging
   */
  debug: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true',
};



// ============================================================================
// API ROUTES
// ============================================================================

export const API_ROUTES = {
  PRICING: {
    /**
     * GET /api/pricing
     * Fetch pricing configuration
     */
    CONFIG: '/api/pricing',

    /**
     * GET /api/pricing/calculate?users={count}
     * Calculate total price based on user count
     */
    CALCULATE: '/api/pricing/calculate',
  },

  AUTH: {
    /**
     * POST /api/auth/register
     * Register new user
     */
    REGISTER: '/api/auth/register',

    /**
     * POST /api/auth/login
     * Login with customerId + email + password
     */
    LOGIN: '/api/auth/login',
  },

  USER: {
    /**
     * GET /api/user/profile
     * Get logged-in user's profile
     */
    PROFILE: '/api/user/profile',

    /**
     * GET /api/user/subscription
     * Get user's subscription details
     */
    SUBSCRIPTION: '/api/user/subscription',

    /**
     * POST /api/user/update-card
     * Initiate card update via PayHere Preapproval
     */
    UPDATE_CARD: '/api/user/update-card',

    /**
     * POST /api/user/confirm-card-update
     * Confirm card update and send email notification
     */
    CONFIRM_CARD_UPDATE: '/api/user/confirm-card-update',

    /**
     * POST /api/user/cancel-subscription
     * Cancel active subscription locally and on PayHere
     */
    CANCEL_SUBSCRIPTION: '/api/user/cancel-subscription',
  },

  ORDER: {
    /**
     * POST /api/order/create
     * Create new order
     */
    CREATE: '/api/order/create',

    /**
     * GET /api/order/{id}
     * Fetch order details
     */
    GET_BY_ID: '/api/order',

    /**
     * GET /api/order/user/{userId}
     * Fetch user's orders
     */
    GET_BY_USER: '/api/order/user',

    /**
     * POST /api/order/cancel
     * Mark a PENDING order as FAILED (called from cancel/fail redirect)
     */
    CANCEL: '/api/order/cancel',
  },

  PAYMENT: {
    /**
     * POST /api/payment/initiate
     * Get signed PayHere checkout fields for an order
     */
    INITIATE: '/api/payment/initiate',

    /**
     * POST /api/payment/confirm
     * Confirm PayHere return payload and update order status if valid
     */
    CONFIRM: '/api/payment/confirm',

    /**
     * POST /api/payment/confirm-success
     * Mark order as ACTIVE after successful payment redirect
     */
    CONFIRM_SUCCESS: '/api/payment/confirm-success',

    /**
     * GET /api/payment/invoice/:orderId
     * Stream invoice PDF for an order
     */
    INVOICE: '/api/payment/invoice',
  },

  ADMIN: {
    /**
     * GET /api/admin/payments
     * List all payments/orders (admin only)
     */
    PAYMENTS: '/api/admin/payments',

    /**
     * GET /api/admin/users
     * List all users (admin only)
     */
    USERS: '/api/admin/users',
  },
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // API Errors
  API_CONNECTION_FAILED: 'Failed to connect to server. Please check your internet connection.',
  API_REQUEST_TIMEOUT: 'Request timed out. Please try again.',
  API_SERVER_ERROR: 'Server error. Please try again later.',

  // Validation Errors
  INVALID_USER_COUNT: 'User count must be greater than 0',
  INVALID_INPUT: 'Please enter a valid value',
  REQUIRED_FIELD: 'This field is required',

  // Pricing Errors
  PRICING_CALCULATION_ERROR: 'Failed to calculate price. Please try again.',
  PRICING_DATA_MISSING: 'Pricing data unavailable',

  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  RETRY_LATER: 'Please try again in a few moments.',
};

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Order created successfully',
  PRICE_CALCULATED: 'Price calculated successfully',
  USER_REGISTERED: 'User registered successfully',
};

// ============================================================================
// WARNING MESSAGES
// ============================================================================

export const WARNING_MESSAGES = {
  LARGE_USER_COUNT: 'This is a large number of users. Please confirm.',
  HIGH_PRICE: 'This price seems unusually high. Please verify.',
};

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI = {
  // Input constraints
  INPUT: {
    MIN_USERS: 1,
    MAX_USERS: 10000,
    STEP: 1,
    PLACEHOLDER: 'Enter number of users',
  },

  // Pricing display
  CURRENCY: {
    LOCALE: process.env.NEXT_PUBLIC_CURRENCY_LOCALE || 'en-US',
    CURRENCY_CODE: process.env.NEXT_PUBLIC_CURRENCY_CODE || 'USD',
  },

  // Debounce delays (ms)
  DEBOUNCE: {
    API_CALL: 300,
    INPUT_VALIDATION: 200,
  },

  // Animation/transition times (ms)
  ANIMATION: {
    FADE_IN: 200,
    SLIDE_IN: 300,
    TOAST_DURATION: 3000,
  },

  // Loading states
  LOADING: {
    SHOW_SPINNER_AFTER_MS: 500,
    HIDE_SPINNER_DELAY_MS: 200,
  },
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_ADVANCED_PRICING: false,
  ENABLE_USER_REGISTRATION: false,
  ENABLE_ORDER_CREATION: true,
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG_PANEL: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true',
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  USER_COUNT: {
    min: 1,
    max: 10000,
    message: 'User count must be between 1 and 10,000',
  },

  PASSWORD: {
    minLength: 12,
    requireUpperCase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    message: 'Password must contain uppercase, numbers, and special characters',
  },

  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build complete API endpoint URL
 * @param endpoint - API route (e.g., '/api/pricing/calculate')
 * @param queryParams - Optional query parameters
 * @returns Full URL with base URL
 */
export function buildApiUrl(
  endpoint: string,
  queryParams?: Record<string, string | number>
): string {
  const url = new URL(endpoint, API_CONFIG.baseUrl);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

/**
 * Format price as currency string.
 * Auto-detects decimal places so small values (e.g. 0.0001) are not rounded to 0.00.
 * @param price - Price value
 * @returns Formatted price string
 */
export function formatPrice(price: number, dynamicCurrencyCode?: string): string {
  // Determine minimum decimal places needed to show at least 1 significant digit
  const abs = Math.abs(price);
  let decimals = 2;
  if (abs > 0 && abs < 0.01) {
    // e.g. 0.0001 → need 4 decimals; find how many zeros after decimal point
    decimals = Math.max(2, Math.ceil(-Math.log10(abs)) + 1);
    decimals = Math.min(decimals, 6); // cap at 6
  }

  const code = dynamicCurrencyCode || UI.CURRENCY.CURRENCY_CODE;

  if (code === "LKR" || code === "Rs") {
    return `Rs. ${price.toFixed(decimals)}`;
  }

  if (!code || !UI.CURRENCY.LOCALE) {
    return price.toFixed(decimals);
  }

  return new Intl.NumberFormat(UI.CURRENCY.LOCALE, {
    style: 'currency',
    currency: code,
    currencyDisplay: 'code',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);
}

/**
 * Get error message by key
 * @param key - Error message key
 * @returns Error message text
 */
export function getErrorMessage(key: keyof typeof ERROR_MESSAGES): string {
  return ERROR_MESSAGES[key] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Get success message by key
 * @param key - Success message key
 * @returns Success message text
 */
export function getSuccessMessage(key: keyof typeof SUCCESS_MESSAGES): string {
  return SUCCESS_MESSAGES[key] || 'Success';
}

/**
 * Check if feature is enabled
 * @param feature - Feature flag name
 * @returns Boolean indicating if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] ?? false;
}

/**
 * Log debug message if debug mode is enabled
 * @param message - Debug message
 * @param data - Optional data to log
 */
export function debugLog(message: string, data?: unknown): void {
  if (API_CONFIG.debug) {
    console.log(`[DEBUG] ${message}`, data);
  }
}
