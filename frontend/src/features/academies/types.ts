export interface Location {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  fieldNumber?: string;
}

export interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Academy {
  id: string;
  name: string;
  academyCode: string;
  managerId: string;
  manager?: Manager; // populated from backend
  location: Location;
  ageGroups: string[];
  maxStudents: number;
  isActive: boolean;
  transferWallEnabled: boolean;
  alertBeforeMinutes: number;
  notificationAlertAfterMinutes: number;
  skillParameters: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcademyPayload {
  name: string;
  academyCode?: string;
  location: Location;
  ageGroups: string[];
  maxStudents: number;
  alertBeforeMinutes: number;
  notificationAlertAfterMinutes: number;
  skillParameters: string[];
  manager: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

export interface AcademyConfigPayload {
  maxStudents?: number;
  ageGroups?: string[];
  alertBeforeMinutes?: number;
  notificationAlertAfterMinutes?: number;
  skillParameters?: string[];
  isActive?: boolean;
}