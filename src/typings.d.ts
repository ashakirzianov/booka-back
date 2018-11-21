declare module 'koa-cors' {
    type CorsOptions = {
        origin: string | boolean,
    };
    type Cors = (options?: CorsOptions) => any; // TODO: try to return middleware

    const cors: Cors;
    export = cors;
}
