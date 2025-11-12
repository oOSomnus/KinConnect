export interface UserSimple {
  id: number;
  username: string;
  email: string;
  checkedInToday?: boolean;
  lastCheckInAt?: string | null;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  isOld: boolean;
  isVerified: boolean;
  guardian: UserSimple | null;
  olds: UserSimple[];
}

export interface MessageDto {
  id?: string;
  text: string;
  execTime: string;
  isOneTime: boolean;
}

export interface CheckInStatus {
  hasGuardian: boolean;
  checkedInToday: boolean;
  lastCheckInAt?: string | null;
  guardian?: UserSimple | null;
}
