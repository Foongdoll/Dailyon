export type UserSummary = {
  id: number;
  nickname: string | null;
  email: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  roles: string[];
  enabled: boolean;
};
