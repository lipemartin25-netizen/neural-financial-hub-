import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.neurafin.hub',
    appName: 'NeuraFin Hub',
    webDir: 'public',
    server: {
        url: process.env.CAPACITOR_SERVER_URL || 'https://neurafin-hub.vercel.app',
        cleartext: process.env.NODE_ENV === 'development'
    }
};

export default config;
