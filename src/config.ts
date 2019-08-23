export function config(): Config {
    return isDebug()
        ? debugConfig()
        : productionConfig();
}

const debugLibUrl = 'http://localhost:3141';
const prodLibUrl = 'https://booka-lib.herokuapp.com';
const useDebugLib = false;
function debugConfig(): Config {
    return {
        libUrl: useDebugLib
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
};

export type SslConfig = {
    keyPath: string,
    certPath: string,
};

export type Config = {
    libUrl: string,
    auth: AuthConfig,
    ssl?: SslConfig,
};
