export interface UserSimple {
  id: number;
  username: string;
  email: string;
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
