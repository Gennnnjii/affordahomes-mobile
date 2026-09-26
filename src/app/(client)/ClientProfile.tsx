import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { clearRoleSession } from "@/lib/auth-session-cache";
import { getApiErrorData, getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
    evaluatePassword,
    isStrongPassword,
    PASSWORD_REQUIREMENTS,
    STRONG_PASSWORD_MESSAGE,
} from "@/lib/password-policy";
import { publicStorageUrl } from "@/lib/storage-url";
import { clearActiveRole } from "@/lib/tokens";
import { userInitials } from "@/lib/userInitials";
import type {
    ClientProfileData,
    UpdateClientProfilePayload,
} from "@/types/client-profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CameraIcon,
    CheckIcon,
    CircleIcon,
    EyeIcon,
    EyeOffIcon,
    KeyRoundIcon,
    LoaderIcon,
    MailIcon,
    PencilIcon,
    PhoneIcon,
    ShieldAlertIcon,
    Trash2Icon,
    UserIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const CLIENT_PROFILE_QUERY_KEY = ["client", "profile"] as const;
const CLIENT_SESSION_QUERY_KEY = ["client", "auth", "session"] as const;
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

type ProfileFormState = {
    first_name: string;
    last_name: string;
    phone: string;
};

type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

type PasswordFormState = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

type PasswordFormErrors = Partial<Record<keyof PasswordFormState, string>>;

const emptyProfileForm: ProfileFormState = {
    first_name: "",
    last_name: "",
    phone: "",
};

const emptyPasswordForm: PasswordFormState = {
    current_password: "",
    password: "",
    password_confirmation: "",
};

const formFromProfile = (profile: ClientProfileData): ProfileFormState => ({
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone ?? "",
});

const validateProfileForm = (
    form: ProfileFormState,
): {
    payload?: UpdateClientProfilePayload;
    errors: ProfileFormErrors;
} => {
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const phone = form.phone.trim();
    const errors: ProfileFormErrors = {};

    if (!firstName) {
        errors.first_name = "First name is required.";
    } else if (firstName.length > 20) {
        errors.first_name = "First name must not exceed 20 characters.";
    }

    if (!lastName) {
        errors.last_name = "Last name is required.";
    } else if (lastName.length > 20) {
        errors.last_name = "Last name must not exceed 20 characters.";
    }

    if (phone.length > 20) {
        errors.phone = "Phone number must not exceed 20 characters.";
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    return {
        payload: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
        },
        errors,
    };
};

const validatePasswordForm = (form: PasswordFormState): PasswordFormErrors => {
    const errors: PasswordFormErrors = {};

    if (!form.current_password) {
        errors.current_password = "Current password is required.";
    }

    if (!form.password) {
        errors.password = "New password is required.";
    } else if (!isStrongPassword(form.password)) {
        errors.password = STRONG_PASSWORD_MESSAGE;
    }

    if (!form.password_confirmation) {
        errors.password_confirmation = "Please confirm your new password.";
    } else if (form.password !== form.password_confirmation) {
        errors.password_confirmation = "Passwords do not match.";
    }

    return errors;
};

const passwordErrorsFromApi = (error: unknown): PasswordFormErrors => {
    const data = getApiErrorData(error);
    const errors: PasswordFormErrors = {};

    for (const field of Object.keys(emptyPasswordForm) as Array<keyof PasswordFormState>) {
        const messages = data?.[field];
        if (Array.isArray(messages) && typeof messages[0] === "string") {
            errors[field] = messages[0];
        }
    }

    return errors;
};

type PasswordFieldProps = {
    id: string;
    label: string;
    value: string;
    autoComplete: "current-password" | "new-password";
    isVisible: boolean;
    isDisabled: boolean;
    error?: string;
    onChange: (value: string) => void;
    onToggleVisibility: () => void;
};

const PasswordField = ({
    id,
    label,
    value,
    autoComplete,
    isVisible,
    isDisabled,
    error,
    onChange,
    onToggleVisibility,
}: PasswordFieldProps) => (
    <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
            <Input
                id={id}
                type={isVisible ? "text" : "password"}
                value={value}
                autoComplete={autoComplete}
                className="pr-11"
                disabled={isDisabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) => onChange(event.target.value)}
            />
            <button
                type="button"
                aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                aria-pressed={isVisible}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/40 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                disabled={isDisabled}
                onClick={onToggleVisibility}
            >
                {isVisible ? (
                    <EyeOffIcon className="size-4" aria-hidden />
                ) : (
                    <EyeIcon className="size-4" aria-hidden />
                )}
            </button>
        </div>
        {error ? (
            <p id={`${id}-error`} className="text-destructive text-xs" role="alert">
                {error}
            </p>
        ) : null}
    </div>
);

const ClientProfile = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<ProfileFormState>(emptyProfileForm);
    const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [passwordForm, setPasswordForm] =
        useState<PasswordFormState>(emptyPasswordForm);
    const [passwordFormErrors, setPasswordFormErrors] =
        useState<PasswordFormErrors>({});
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [isDeactivationDialogOpen, setIsDeactivationDialogOpen] = useState(false);
    const [deactivationPassword, setDeactivationPassword] = useState("");
    const [deactivationPasswordError, setDeactivationPasswordError] = useState<
        string | undefined
    >();
    const [showDeactivationPassword, setShowDeactivationPassword] = useState(false);

    const profileQuery = useQuery({
        queryKey: CLIENT_PROFILE_QUERY_KEY,
        queryFn: clientPortalApi.profile,
        refetchInterval: 2_000,
        retry: false,
    });

    const clearPhotoSelection = () => {
        setSelectedPhoto(null);
        setPhotoPreviewUrl(null);
        if (photoInputRef.current) {
            photoInputRef.current.value = "";
        }
    };

    useEffect(
        () => () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
        },
        [photoPreviewUrl],
    );

    const updateProfileMutation = useMutation({
        mutationFn: clientPortalApi.updateProfile,
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: clientPortalApi.uploadProfilePhoto,
    });

    const removePhotoMutation = useMutation({
        mutationFn: clientPortalApi.removeProfilePhoto,
    });

    const changePasswordMutation = useMutation({
        mutationFn: clientPortalApi.changePassword,
    });

    const deactivateAccountMutation = useMutation({
        mutationFn: clientPortalApi.deactivateAccount,
    });

    const profile = profileQuery.data?.data;
    const fullName = profile
        ? `${profile.first_name} ${profile.last_name}`.trim() || "—"
        : "—";
    const initials = userInitials(
        profile?.first_name,
        profile?.last_name,
        profile?.email,
    );
    const photoSource =
        photoPreviewUrl ?? publicStorageUrl(profile?.profile_picture);
    const isProfileBusy =
        updateProfileMutation.isPending ||
        uploadPhotoMutation.isPending ||
        removePhotoMutation.isPending;
    const passwordEvaluation = evaluatePassword(passwordForm.password);

    const setProfileResponse = (response: {
        status: true;
        message: string;
        data: ClientProfileData;
    }) => {
        queryClient.setQueryData(CLIENT_PROFILE_QUERY_KEY, response);
    };

    const beginEditing = () => {
        if (!profile) return;
        setForm(formFromProfile(profile));
        setFormErrors({});
        setIsEditing(true);
    };

    const cancelEditing = () => {
        if (profile) {
            setForm(formFromProfile(profile));
        }
        setFormErrors({});
        setIsEditing(false);
    };

    const submitProfile = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const validation = validateProfileForm(form);
        setFormErrors(validation.errors);

        if (!validation.payload) return;

        updateProfileMutation.mutate(validation.payload, {
            onSuccess: async (response) => {
                setProfileResponse(response);
                setForm(formFromProfile(response.data));
                setIsEditing(false);
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: CLIENT_PROFILE_QUERY_KEY,
                    }),
                    queryClient.invalidateQueries({
                        queryKey: CLIENT_SESSION_QUERY_KEY,
                    }),
                ]);
                toast.success(response.message || "Profile updated successfully.");
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
        });
    };

    const selectPhoto = (file: File | null) => {
        if (!file) {
            clearPhotoSelection();
            return;
        }

        if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
            clearPhotoSelection();
            toast.error("Choose a JPG, PNG or WebP image.");
            return;
        }

        if (file.size > MAX_PHOTO_SIZE) {
            clearPhotoSelection();
            toast.error("Profile photo must not exceed 2 MB.");
            return;
        }

        setSelectedPhoto(file);
        setPhotoPreviewUrl(URL.createObjectURL(file));
    };

    const uploadSelectedPhoto = () => {
        if (!selectedPhoto) return;

        uploadPhotoMutation.mutate(selectedPhoto, {
            onSuccess: async (response) => {
                setProfileResponse(response);
                clearPhotoSelection();
                await queryClient.invalidateQueries({
                    queryKey: CLIENT_PROFILE_QUERY_KEY,
                });
                toast.success(response.message || "Profile photo updated successfully.");
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
        });
    };

    const removePhoto = () => {
        if (!profile?.profile_picture) return;
        if (!window.confirm("Remove your profile photo?")) return;

        removePhotoMutation.mutate(undefined, {
            onSuccess: async (response) => {
                setProfileResponse(response);
                await queryClient.invalidateQueries({
                    queryKey: CLIENT_PROFILE_QUERY_KEY,
                });
                toast.success(response.message || "Profile photo removed successfully.");
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
        });
    };

    const updatePasswordField = (field: keyof PasswordFormState, value: string) => {
        setPasswordForm((current) => ({ ...current, [field]: value }));
        setPasswordFormErrors((current) => ({
            ...current,
            [field]: undefined,
            ...(field === "password" ? { password_confirmation: undefined } : {}),
        }));
    };

    const submitPassword = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const errors = validatePasswordForm(passwordForm);
        setPasswordFormErrors(errors);

        if (Object.keys(errors).length > 0) return;

        changePasswordMutation.mutate(passwordForm, {
            onSuccess: (response) => {
                setPasswordForm(emptyPasswordForm);
                setPasswordFormErrors({});
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowPasswordConfirmation(false);
                clearRoleSession(queryClient, "client");
                clearActiveRole();
                toast.success(
                    response.message ||
                    "Your password has been changed. Please sign in again.",
                );
                navigate({ to: "/auth/login", replace: true });
            },
            onError: (error) => {
                setPasswordFormErrors(passwordErrorsFromApi(error));
                toast.error(getApiErrorMessage(error));
            },
        });
    };

    const resetDeactivationForm = () => {
        setDeactivationPassword("");
        setDeactivationPasswordError(undefined);
        setShowDeactivationPassword(false);
        deactivateAccountMutation.reset();
    };

    const handleDeactivationDialogOpenChange = (open: boolean) => {
        if (deactivateAccountMutation.isPending) return;

        setIsDeactivationDialogOpen(open);
        if (!open) resetDeactivationForm();
    };

    const submitDeactivation = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!deactivationPassword) {
            setDeactivationPasswordError("Current password is required.");
            return;
        }

        setDeactivationPasswordError(undefined);
        deactivateAccountMutation.mutate(deactivationPassword, {
            onSuccess: async (response) => {
                const sessionRefresh = queryClient.resetQueries({
                    queryKey: CLIENT_SESSION_QUERY_KEY,
                    exact: true,
                });
                resetDeactivationForm();
                setIsDeactivationDialogOpen(false);
                toast.success(
                    response.message || "Your account has been scheduled for deactivation.",
                );
                await sessionRefresh;
            },
            onError: (error) => {
                const passwordErrors = getApiErrorData(error)?.password;
                setDeactivationPasswordError(
                    Array.isArray(passwordErrors) && typeof passwordErrors[0] === "string"
                        ? passwordErrors[0]
                        : undefined,
                );
                toast.error(getApiErrorMessage(error));
            },
        });
    };

    if (profileQuery.isPending) {
        return (
            <div className="space-y-6">
                <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    <Skeleton className="h-80 rounded-xl" />
                    <Skeleton className="h-96 rounded-xl" />
                </div>
            </div>
        );
    }

    if (profileQuery.isError || !profile) {
        return (
            <div className="space-y-6">
                <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
                <Card className="border-destructive/40">
                    <CardContent className="space-y-3 p-6 text-center">
                        <p className="text-destructive text-sm" role="alert">
                            {getApiErrorMessage(profileQuery.error)}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => profileQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage your contact details and profile photo.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <Card className="border-border/80 lg:self-start">
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
                        <div className="bg-primary text-primary-foreground relative flex size-24 items-center justify-center overflow-hidden rounded-full text-2xl font-semibold">
                            <span>{initials}</span>
                            {photoSource ? (
                                <img
                                    key={photoSource}
                                    src={photoSource}
                                    alt={`${fullName} profile photo`}
                                    className="absolute inset-0 size-full object-cover"
                                    onError={(event) => {
                                        event.currentTarget.hidden = true;
                                    }}
                                />
                            ) : null}
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-semibold">{fullName}</p>
                            <p className="text-muted-foreground break-all text-sm">
                                {profile.email}
                            </p>
                        </div>

                        <div className="w-full space-y-3">
                            <input
                                ref={photoInputRef}
                                id="client-profile-photo"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                disabled={isProfileBusy}
                                aria-label="Choose profile photo"
                                onChange={(event) =>
                                    selectPhoto(event.target.files?.[0] ?? null)
                                }
                            />

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={isProfileBusy}
                                onClick={() => photoInputRef.current?.click()}
                            >
                                <CameraIcon />
                                {profile.profile_picture ? "Change photo" : "Add photo"}
                            </Button>

                            {selectedPhoto ? (
                                <div className="space-y-2">
                                    <p
                                        className="text-muted-foreground truncate text-center text-xs"
                                        title={selectedPhoto.name}
                                    >
                                        {selectedPhoto.name}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isProfileBusy}
                                            onClick={uploadSelectedPhoto}
                                        >
                                            {uploadPhotoMutation.isPending ? (
                                                <LoaderIcon className="animate-spin" />
                                            ) : null}
                                            {uploadPhotoMutation.isPending
                                                ? "Uploading…"
                                                : "Upload photo"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isProfileBusy}
                                            onClick={clearPhotoSelection}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : profile.profile_picture ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive w-full"
                                    disabled={isProfileBusy}
                                    onClick={removePhoto}
                                >
                                    {removePhotoMutation.isPending ? (
                                        <LoaderIcon className="animate-spin" />
                                    ) : (
                                        <Trash2Icon />
                                    )}
                                    {removePhotoMutation.isPending
                                        ? "Removing…"
                                        : "Remove photo"}
                                </Button>
                            ) : null}

                            <p className="text-muted-foreground text-center text-xs">
                                JPG, PNG or WebP • Max 2 MB
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/80">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <CardTitle>Account details</CardTitle>
                        {!isEditing ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isProfileBusy}
                                onClick={beginEditing}
                            >
                                <PencilIcon />
                                Edit profile
                            </Button>
                        ) : null}
                    </CardHeader>
                    {isEditing ? (
                        <CardContent>
                            <form className="space-y-5" onSubmit={submitProfile}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="client-first-name">First name</Label>
                                        <Input
                                            id="client-first-name"
                                            value={form.first_name}
                                            maxLength={20}
                                            autoComplete="given-name"
                                            disabled={isProfileBusy}
                                            aria-invalid={Boolean(formErrors.first_name)}
                                            aria-describedby={
                                                formErrors.first_name
                                                    ? "client-first-name-error"
                                                    : undefined
                                            }
                                            onChange={(event) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    first_name: event.target.value,
                                                }));
                                                setFormErrors((current) => ({
                                                    ...current,
                                                    first_name: undefined,
                                                }));
                                            }}
                                        />
                                        {formErrors.first_name ? (
                                            <p
                                                id="client-first-name-error"
                                                className="text-destructive text-xs"
                                                role="alert"
                                            >
                                                {formErrors.first_name}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="client-last-name">Last name</Label>
                                        <Input
                                            id="client-last-name"
                                            value={form.last_name}
                                            maxLength={20}
                                            autoComplete="family-name"
                                            disabled={isProfileBusy}
                                            aria-invalid={Boolean(formErrors.last_name)}
                                            aria-describedby={
                                                formErrors.last_name
                                                    ? "client-last-name-error"
                                                    : undefined
                                            }
                                            onChange={(event) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    last_name: event.target.value,
                                                }));
                                                setFormErrors((current) => ({
                                                    ...current,
                                                    last_name: undefined,
                                                }));
                                            }}
                                        />
                                        {formErrors.last_name ? (
                                            <p
                                                id="client-last-name-error"
                                                className="text-destructive text-xs"
                                                role="alert"
                                            >
                                                {formErrors.last_name}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-phone">Phone</Label>
                                    <Input
                                        id="client-phone"
                                        type="tel"
                                        value={form.phone}
                                        maxLength={20}
                                        autoComplete="tel"
                                        disabled={isProfileBusy}
                                        aria-invalid={Boolean(formErrors.phone)}
                                        aria-describedby={
                                            formErrors.phone
                                                ? "client-phone-error"
                                                : undefined
                                        }
                                        onChange={(event) => {
                                            setForm((current) => ({
                                                ...current,
                                                phone: event.target.value,
                                            }));
                                            setFormErrors((current) => ({
                                                ...current,
                                                phone: undefined,
                                            }));
                                        }}
                                    />
                                    {formErrors.phone ? (
                                        <p
                                            id="client-phone-error"
                                            className="text-destructive text-xs"
                                            role="alert"
                                        >
                                            {formErrors.phone}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-email">Email address</Label>
                                    <Input
                                        id="client-email"
                                        type="email"
                                        value={profile.email}
                                        readOnly
                                        aria-readonly="true"
                                        className="bg-muted/40"
                                    />
                                    <p className="text-muted-foreground text-xs">
                                        Email changes are managed through the secure account email
                                        flow.
                                    </p>
                                </div>

                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isProfileBusy}
                                        onClick={cancelEditing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isProfileBusy}>
                                        {updateProfileMutation.isPending ? (
                                            <LoaderIcon className="animate-spin" />
                                        ) : null}
                                        {updateProfileMutation.isPending
                                            ? "Saving…"
                                            : "Save changes"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    ) : (
                        <CardContent className="space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                    <UserIcon className="text-muted-foreground size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Full name
                                    </p>
                                    <p className="mt-0.5 break-words font-medium">{fullName}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-start gap-3">
                                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                    <MailIcon className="text-muted-foreground size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Email address
                                    </p>
                                    <p className="mt-0.5 break-all font-medium">
                                        {profile.email}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-start gap-3">
                                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                    <PhoneIcon className="text-muted-foreground size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Phone
                                    </p>
                                    <p className="mt-0.5 break-words font-medium">
                                        {profile.phone?.trim() || "Not provided"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>

            <Card className="border-border/80">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <KeyRoundIcon className="size-5" aria-hidden />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <CardTitle>Change password</CardTitle>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Update your password securely. You will need to sign in again on
                                all devices after it is changed.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="max-w-3xl space-y-5" onSubmit={submitPassword}>
                        <PasswordField
                            id="client-current-password"
                            label="Current password"
                            value={passwordForm.current_password}
                            autoComplete="current-password"
                            isVisible={showCurrentPassword}
                            isDisabled={changePasswordMutation.isPending}
                            error={passwordFormErrors.current_password}
                            onChange={(value) =>
                                updatePasswordField("current_password", value)
                            }
                            onToggleVisibility={() =>
                                setShowCurrentPassword((current) => !current)
                            }
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <PasswordField
                                id="client-new-password"
                                label="New password"
                                value={passwordForm.password}
                                autoComplete="new-password"
                                isVisible={showNewPassword}
                                isDisabled={changePasswordMutation.isPending}
                                error={passwordFormErrors.password}
                                onChange={(value) => updatePasswordField("password", value)}
                                onToggleVisibility={() =>
                                    setShowNewPassword((current) => !current)
                                }
                            />

                            <PasswordField
                                id="client-password-confirmation"
                                label="Confirm new password"
                                value={passwordForm.password_confirmation}
                                autoComplete="new-password"
                                isVisible={showPasswordConfirmation}
                                isDisabled={changePasswordMutation.isPending}
                                error={passwordFormErrors.password_confirmation}
                                onChange={(value) =>
                                    updatePasswordField("password_confirmation", value)
                                }
                                onToggleVisibility={() =>
                                    setShowPasswordConfirmation((current) => !current)
                                }
                            />
                        </div>

                        <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-3">
                            <div
                                className="flex items-center justify-between gap-3 text-xs font-medium"
                                role="status"
                                aria-live="polite"
                            >
                                <span className="text-muted-foreground">Password strength</span>
                                <span
                                    className={cn(
                                        passwordEvaluation.strength === "Strong"
                                            ? "text-primary"
                                            : passwordEvaluation.strength === "Fair"
                                                ? "text-amber-600"
                                                : "text-destructive",
                                    )}
                                >
                                    {passwordEvaluation.strength}
                                </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1" aria-hidden>
                                {PASSWORD_REQUIREMENTS.map((requirement, index) => (
                                    <span
                                        key={requirement.key}
                                        className={cn(
                                            "bg-border h-1.5 rounded-full transition-colors duration-200 motion-reduce:transition-none",
                                            index < passwordEvaluation.satisfiedCount &&
                                            (passwordEvaluation.strength === "Strong"
                                                ? "bg-primary"
                                                : passwordEvaluation.strength === "Fair"
                                                    ? "bg-amber-500"
                                                    : "bg-destructive"),
                                        )}
                                    />
                                ))}
                            </div>
                            <ul
                                className="grid gap-1.5 text-xs sm:grid-cols-2"
                                aria-label="Password requirements"
                            >
                                {PASSWORD_REQUIREMENTS.map((requirement) => {
                                    const isMet =
                                        passwordEvaluation.requirements[requirement.key];

                                    return (
                                        <li
                                            key={requirement.key}
                                            className={cn(
                                                "flex items-center gap-2",
                                                isMet
                                                    ? "text-primary"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {isMet ? (
                                                <CheckIcon
                                                    className="size-3.5 shrink-0"
                                                    aria-hidden
                                                />
                                            ) : (
                                                <CircleIcon
                                                    className="size-3.5 shrink-0"
                                                    aria-hidden
                                                />
                                            )}
                                            <span className="sr-only">
                                                {isMet ? "Met: " : "Not met: "}
                                            </span>
                                            <span>{requirement.label}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                className="w-full sm:w-auto"
                                disabled={changePasswordMutation.isPending}
                            >
                                {changePasswordMutation.isPending ? (
                                    <LoaderIcon className="animate-spin" />
                                ) : null}
                                {changePasswordMutation.isPending
                                    ? "Changing password…"
                                    : "Change password"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-destructive/40">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <div className="bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <ShieldAlertIcon className="size-5" aria-hidden />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <CardTitle>Danger zone</CardTitle>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Manage high-impact changes to your account.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                            <p className="font-medium">Deactivate account</p>
                            <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                                Deactivation is not immediate deletion. Your account enters a
                                30-day pending period, during which you can cancel the request.
                                After the deadline, the account becomes deactivated and cannot be
                                reactivated through the current self-service flow. Your existing
                                account and business history are preserved.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            className="w-full sm:w-auto"
                            onClick={() => setIsDeactivationDialogOpen(true)}
                        >
                            Deactivate account
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={isDeactivationDialogOpen}
                onOpenChange={handleDeactivationDialogOpenChange}
            >
                <DialogContent
                    className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
                    showCloseButton={!deactivateAccountMutation.isPending}
                >
                    <form className="space-y-5" onSubmit={submitDeactivation}>
                        <DialogHeader>
                            <DialogTitle>Schedule account deactivation?</DialogTitle>
                            <DialogDescription>
                                Enter your current password to confirm. Normal account access will
                                be paused during the 30-day pending period.
                            </DialogDescription>
                        </DialogHeader>

                        <PasswordField
                            id="client-deactivation-password"
                            label="Current password"
                            value={deactivationPassword}
                            autoComplete="current-password"
                            isVisible={showDeactivationPassword}
                            isDisabled={deactivateAccountMutation.isPending}
                            error={deactivationPasswordError}
                            onChange={(value) => {
                                setDeactivationPassword(value);
                                setDeactivationPasswordError(undefined);
                            }}
                            onToggleVisibility={() =>
                                setShowDeactivationPassword((current) => !current)
                            }
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={deactivateAccountMutation.isPending}
                                onClick={() => handleDeactivationDialogOpenChange(false)}
                            >
                                Keep account active
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={
                                    deactivateAccountMutation.isPending || !deactivationPassword
                                }
                            >
                                {deactivateAccountMutation.isPending ? (
                                    <LoaderIcon className="animate-spin" />
                                ) : null}
                                {deactivateAccountMutation.isPending
                                    ? "Scheduling…"
                                    : "Schedule deactivation"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientProfile;
