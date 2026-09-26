export const STRONG_PASSWORD_MESSAGE =
    "The password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";

export const STRONG_PASSWORD_GUIDANCE =
    "Use 8+ characters with uppercase, lowercase, a number, and a special character.";

export const PASSWORD_REQUIREMENTS = [
    { key: "minimumLength", label: "8+ characters" },
    { key: "uppercase", label: "Uppercase letter" },
    { key: "lowercase", label: "Lowercase letter" },
    { key: "number", label: "Number" },
    { key: "specialCharacter", label: "Special character" },
] as const;

export type PasswordRequirementKey = (typeof PASSWORD_REQUIREMENTS)[number]["key"];
export type PasswordStrengthLabel = "Weak" | "Fair" | "Strong";

export type PasswordEvaluation = {
    requirements: Record<PasswordRequirementKey, boolean>;
    satisfiedCount: number;
    strength: PasswordStrengthLabel;
};

const UPPERCASE_PATTERN = /\p{Lu}/u;
const LOWERCASE_PATTERN = /\p{Ll}/u;
const NUMBER_PATTERN = /\p{N}/u;
const PUNCTUATION_OR_SYMBOL_PATTERN = /[\p{P}\p{S}]/u;

export const evaluatePassword = (password: string): PasswordEvaluation => {
    const requirements: PasswordEvaluation["requirements"] = {
        minimumLength: Array.from(password).length >= 8,
        uppercase: UPPERCASE_PATTERN.test(password),
        lowercase: LOWERCASE_PATTERN.test(password),
        number: NUMBER_PATTERN.test(password),
        specialCharacter: PUNCTUATION_OR_SYMBOL_PATTERN.test(password),
    };
    const satisfiedCount = PASSWORD_REQUIREMENTS.filter(
        ({ key }) => requirements[key],
    ).length;

    return {
        requirements,
        satisfiedCount,
        strength:
            satisfiedCount === PASSWORD_REQUIREMENTS.length
                ? "Strong"
                : satisfiedCount >= 3
                  ? "Fair"
                  : "Weak",
    };
};

export const isStrongPassword = (password: string): boolean =>
    evaluatePassword(password).satisfiedCount === PASSWORD_REQUIREMENTS.length;
