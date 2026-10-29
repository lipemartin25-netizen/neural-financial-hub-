import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.neurafin.hub',
    appName: 'NeuraFin Hub',
    webDir: 'public',
    server: {
        // Aponta para o backend de produção Vercel ou IP local para desenvolvimento
        url: process.env.CAPACITOR_SERVER_URL || 'https://neurafin-hub.vercel.app',
        cleartext: true
    }
};

export default config;
