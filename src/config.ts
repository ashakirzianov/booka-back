import { config as configEnv } from 'dotenv';
configEnv();

export function config(): Config {
    return isDebug()
        ? debugConfig()
        : productionConfig();
}

const debugLibUrl = 'http://localhost:3141';
const prodLibUrl = 'https://booka-lib.herokuapp.com';
const useLocalServices = process.env.LOCAL === 'all';
function debugConfig(): Config {
    return {
        port: process.env.PORT || '3042',
        libUrl: useLocalServices
            ? debugLibUrl
            : prodLibUrl,
        auth: authConfig,
        ssl: {
            keyPath: 'server.key',
            certPath: 'server.crt',
        },
    };
}

function productionConfig(): Config {
    return {
        port: process.env.PORT || '3042',
        libUrl: prodLibUrl,
        auth: authConfig,
    };
}

function isDebug() {
    return process.env.NODE_ENV === 'development';
}

const authConfig: AuthConfig = {
    facebook: {
        clientID: process.env.FB_ID || '',
        clientSecret: process.env.FB_SECRET || '',
        callbackUrl: 'http://localhost:3000/auth/callback',
        profileFields: ['displayName'],
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'secret',
        audience: 'booka',
        issuer: 'booka',
    },
    mongoDbUri: process.env.BACK_MONGODB_URI || 'mongodb://localhost:27017/booka',
};

export type FacebookProfileField =
    | 'id' | 'displayName' | 'photos' | 'email';
export type FacebookConfig = {
    clientID: string,
    clientSecret: string,
    callbackUrl: string,
    profileFields: FacebookProfileField[],
};

export type JwtConfig = {
    secret: string,
    issuer: string,
    audience: string,
};

export type AuthConfig = {
    facebook: FacebookConfig,
    jwt: JwtConfig,
    mongoDbUri: string,
};

export type SslConfig = {
    keyPath: string,
    certPath: string,
};

export type Config = {
    port: string,
    libUrl: string,
    auth: AuthConfig,
    ssl?: SslConfig,
};
