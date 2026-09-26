export type OverallLeaderboardAgent = {
    agent_id: string;
    agent_name: string;
    sales: number;
    reservations: number;
    appointments: number;
    referrals: number;
    rating: number;
    score: number;
    rank: number;
};

export type MonthlyLeaderboard = {
    period: "monthly";
    month: number;
    year: number;
    agents: OverallLeaderboardAgent[];
};

export type YearlyLeaderboard = {
    period: "yearly";
    year: number;
    agents: OverallLeaderboardAgent[];
};

export type TopRatedLeaderboardAgent = {
    agent_id: string;
    agent_name: string;
    rating: number;
    rating_count: number;
    rank: number;
};

export type TopRatedLeaderboard = {
    period: "yearly";
    year: number;
    agents: TopRatedLeaderboardAgent[];
};

export type TopReferralsLeaderboardAgent = {
    agent_id: string;
    agent_name: string;
    referrals: number;
    rank: number;
};

export type TopReferralsLeaderboard = {
    period: "yearly";
    year: number;
    agents: TopReferralsLeaderboardAgent[];
};

export type PublicLeaderboardAgent = {
    agent_id: string;
    agent_name: string;
    sales: number;
    rating: number;
    rank: number;
};

export type PublicMonthlyLeaderboard = {
    period: "monthly";
    month: number;
    year: number;
    agents: PublicLeaderboardAgent[];
};

export type PublicYearlyLeaderboard = {
    period: "yearly";
    year: number;
    agents: PublicLeaderboardAgent[];
};
