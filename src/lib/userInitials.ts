export const userInitials = (f?: string, l?: string, email?: string): string => {
    const a = f?.trim().charAt(0).toUpperCase() ?? "";
    const b = l?.trim().charAt(0).toUpperCase() ?? "";
    if (a && b) return `${a}${b}`;
    if (a) return a;
    const e = email?.trim();
    if (e) return e.charAt(0).toUpperCase();
    return "?";
};
