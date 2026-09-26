interface ImportMetaEnv {
    readonly VITE_BACKEND_WS_BASE_URL: string;
    readonly VITE_BACKEND_BASE_URL: string;

    readonly PROD_SERVER_HOST: string;
    readonly PROD_SERVER_ALLOWED_HOST: string;

    readonly VITE_TOKEN_NAME: string;
    readonly VITE_CLIENT_TOKEN_NAME?: string;
    readonly VITE_AGENT_TOKEN_NAME?: string;
    readonly VITE_ADMIN_TOKEN_NAME?: string;

    readonly VITE_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}