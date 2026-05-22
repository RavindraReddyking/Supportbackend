export type ApiResponse<T> = {
    success: true;
    api: string;
    data: T;
    mode?: string;
};
export type ApiListResponse<T> = {
    success: true;
    api: string;
    count: number;
    data: T[];
    mode?: string;
};
