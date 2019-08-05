export function config(): Config {
    return debugConfig();
}

function debugConfig(): Config {
    return {
        auth: authConfig,
    };
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
    auth: AuthConfig,
    ssl?: SslConfig,
};
