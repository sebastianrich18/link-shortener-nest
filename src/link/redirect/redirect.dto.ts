export interface RedirectResponse {
    url: string;
    statusCode: number;
    expireAt: string | null;
}
