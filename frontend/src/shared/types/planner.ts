export type PlannerParticipant = {
  id: number;
  nickname: string | null;
  email: string;
};

export type PlannerEvent = {
  id: number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  remarks?: string | null;
  supplies?: string | null;
  location?: string | null;
  tags: string[];
  participants: PlannerParticipant[];
  guestNames: string[];
  shared: boolean;
  shareCode?: string | null;
  ownerName: string;
  editable: boolean;
};

export type PlannerEventRequest = {
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  remarks?: string | null;
  supplies?: string | null;
  location?: string | null;
  tags: string[];
  participantIds: number[];
  guestNames: string[];
  shared?: boolean;
};
