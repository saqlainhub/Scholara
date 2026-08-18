export const AUTH_COOKIE_NAME = "scolara_session";

export const AUTH_ROLES = [
    "HEAD",
    "TEACHER",
    "STUDENT",
] as const;

export type AuthRole =
    (typeof AUTH_ROLES)[number];

export const PORTAL_PATHS = {
    HEAD: "/head",
    TEACHER: "/teacher",
    STUDENT: "/student",
} as const;