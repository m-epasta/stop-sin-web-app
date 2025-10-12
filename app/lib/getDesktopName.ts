import { v4 as uuidv4 } from 'uuid';

export const SIGNATURE_KEY = 'user_signature';

/**
 * Retrieves a unique user signature from localStorage.
 * If a signature doesn't exist, it creates a new one, stores it, and returns it.
 * This helps in uniquely identifying a browser for purposes like rate limiting.
 */
export const getUserSignature = (): string => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return 'server-side-render';
        // define a key later and dont forget to commit into git
    }

    let signature = localStorage.getItem(SIGNATURE_KEY);

    if (!signature) {
        signature = uuidv4();
        localStorage.setItem(SIGNATURE_KEY, signature);
    }

    return signature;
};
