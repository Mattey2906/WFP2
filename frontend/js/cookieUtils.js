// cookieUtils.js

/**
 * Liest einen Cookie-Wert.
 * @param {string} name - Der Name des Cookies.
 * @returns {string|null} - Der Wert des Cookies oder null, falls nicht vorhanden.
 */
export function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return value;
    }
    return null;
}

/**
 * Setzt einen Cookie-Wert.
 * @param {string} name - Der Name des Cookies.
 * @param {string} value - Der Wert des Cookies.
 */
export function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/;`;
}
