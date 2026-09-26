export type AgentReferralData = {
    referral_code: string;
    referral_link: string;
    clicks: number;
    registrations: number;
};

export type ReferralResolutionData = {
    valid: true;
    referral_code: string;
};

export type AgentReferredClient = {
    first_name: string;
    last_name: string;
    referred_at: string | null;
};
