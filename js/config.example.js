// API Configuration Template
// Copy this file to config.js and add your real API keys

const CONFIG = {
    // SheetDB API URLs
    ESTOQUE_API: 'https://sheetdb.io/api/v1/SEU_ID_AQUI',
    USERS_API: 'https://sheetdb.io/api/v1/SEU_ID_AQUI?sheet=usuarios',

    // Cache settings
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes

    // App settings
    APP_NAME: 'Loggi Stock',
    VERSION: '2.0.0'
};

// Export for use in other files
window.CONFIG = CONFIG;
