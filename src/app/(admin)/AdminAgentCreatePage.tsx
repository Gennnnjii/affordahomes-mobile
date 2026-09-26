import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SubmitOverlay } from "@/components/app/SubmitOverlay";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UserRoundIcon } from "lucide-react";
import { isStrongPassword, STRONG_PASSWORD_GUIDANCE } from "@/lib/password-policy";

const AdminAgentCreatePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [first_name, setFirst] = useState("");
    const [last_name, setLast] = useState("");
    const [email, setEmail] = useState("");
    const [age, setAge] = useState("25");
    const [password, setPassword] = useState("");
    const [position, setPosition] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [mobile, setMobile] = useState("");
    const [employmentType, setEmploymentType] = useState<"full_time" | "part_time">("full_time");
    const [monthlyAllowance, setMonthlyAllowance] = useState("");
    const [monthlyQuota, setMonthlyQuota] = useState("");
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setProfilePicture(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const mut = useMutation({
        mutationFn: () =>
            adminResourceApi.createAgent({
                first_name,
                last_name,
                email,
                age: Number(age),
                password,
                profile_picture: profilePicture,
                position: position || undefined,
                description: description || undefined,
                location: location || undefined,
                mobile: mobile || undefined,
                employment_type: employmentType,
                monthly_allowance: monthlyAllowance ? Number(monthlyAllowance) : undefined,
                monthly_quota: monthlyQuota ? Number(monthlyQuota) : undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "agents"] });
            toast.success("Agent created.");
            navigate({ to: "/admin/agents" });
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const initials =
        `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase() || null;
    const isPasswordValid = isStrongPassword(password);

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/admin/agents" label="Agents" hideFrom="md" />

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

                <Card className="border-border/80 relative overflow-hidden lg:self-start">
                    <CardHeader>
                        <CardTitle className="text-xl">Create agent</CardTitle>
                        <CardDescription>Provision a new agent account with login credentials.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>First name</Label>
                                <Input value={first_name} onChange={(e) => setFirst(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Last name</Label>
                                <Input value={last_name} onChange={(e) => setLast(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    {STRONG_PASSWORD_GUIDANCE}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>
                                    Position{" "}
                                    <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Input
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="e.g. Senior Sales Agent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    Mobile{" "}
                                    <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Input
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder="+63 900 000 0000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>
                                Location{" "}
                                <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Mabalacat, Pampanga"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                Description{" "}
                                <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Brief bio or intro shown on the public agents page"
                            />
                        </div>

                        <Separator />

                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">HR details</p>

                        <div className="grid gap-5 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Employment type</Label>
                                <select
                                    value={employmentType}
                                    onChange={(e) => setEmploymentType(e.target.value as "full_time" | "part_time")}
                                    className="border-input bg-background text-foreground w-full rounded-md border px-3 py-2 text-sm"
                                >
                                    <option value="full_time">Full-time (with CAA)</option>
                                    <option value="part_time">Part-time (no CAA)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    Monthly allowance (CAA){" "}
                                    <span className="text-muted-foreground font-normal">(₱)</span>
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={monthlyAllowance}
                                    onChange={(e) => setMonthlyAllowance(e.target.value)}
                                    placeholder="e.g. 5000"
                                    disabled={employmentType === "part_time"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Monthly quota <span className="text-muted-foreground font-normal">(units)</span></Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={monthlyQuota}
                                    onChange={(e) => setMonthlyQuota(e.target.value)}
                                    placeholder="e.g. 5"
                                />
                            </div>
                        </div>

                        <Separator />
                        <Button
                            onClick={() => mut.mutate()}
                            disabled={mut.isPending || !isPasswordValid}
                            size="lg"
                        >
                            Create agent
                        </Button>
                    </CardContent>
                    <SubmitOverlay show={mut.isPending} />
                </Card>

                <div className="flex flex-col gap-4 lg:self-start">

                    <Card className="border-border/80">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Profile photo</CardTitle>
                            <CardDescription>Optional. Displayed on listings and public pages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            <div className="flex justify-center">
                                <div className="border-border bg-muted relative size-28 overflow-hidden rounded-full border-2">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt=""
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-1">
                                            {initials ? (
                                                <span className="text-2xl font-semibold text-foreground/60">
                                                    {initials}
                                                </span>
                                            ) : (
                                                <UserRoundIcon className="size-10" strokeWidth={1.2} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? "Change photo" : "Upload photo"}
                            </Button>
                            {previewUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-destructive hover:text-destructive"
                                    onClick={() => {
                                        setProfilePicture(null);
                                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                >
                                    Remove
                                </Button>
                            )}
                            <p className="text-muted-foreground text-xs text-center">
                                JPEG, PNG, or WebP · max 2 MB
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">After creating</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                            <p>
                                The agent can log in at{" "}
                                <span className="text-foreground font-medium">/agent/login</span> using
                                their email and password.
                            </p>
                            <p>
                                Their employee ID is auto-generated. Credentials and photo can be
                                updated at any time from the Agents list.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminAgentCreatePage;
