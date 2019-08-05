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

export function config(): AuthConfig {
    return debugConfig();
}

function debugConfig(): AuthConfig {
    return {
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
}
