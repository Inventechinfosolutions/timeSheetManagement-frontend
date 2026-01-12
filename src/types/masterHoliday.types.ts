export interface MasterHoliday {
  id: number;
  date: string; // Date string from JSON
  name: string;
  type?: string;
  isWeekendHoliday: boolean;
  documentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateHolidayPayload {
  date: string;
  name: string;
  type?: string;
  isWeekendHoliday?: boolean;
}

export interface UpdateHolidayPayload {
  id: number;
  data: Partial<CreateHolidayPayload>;
}

export interface HolidayDateRangePayload {
  fromDate: string;
  toDate: string;
}

// Enums based on backend usage
export enum ReferenceType {
  MASTER_HOLIDAY_DOCUMENT = 'MASTER_HOLIDAY_DOCUMENT',
  // Add other types if known, otherwise keep this minimal for now
}

export enum EntityType {
  MASTER_HOLIDAY = 'MASTER_HOLIDAY',
  // Add other types if known
}

export interface UploadHolidayFilePayload {
  entityId: number;
  refId: number; // Often same as entityId for simple holidays, or specific ref
  file: File;
  refType: ReferenceType;
  entityType: EntityType;
}

export interface FetchHolidayFilesPayload {
  entityId: number;
  refId: number;
  refType?: ReferenceType;
  entityType: EntityType;
}

export interface DeleteHolidayFilePayload {
  entityId: number;
  refId: number;
  key: string;
  entityType: EntityType;
}

export interface UploadedFileDto {
  key: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface FetchByMonthPayload {
  month: number;
}

export interface FetchByMonthAndYearPayload {
  month: number;
  year: number;
}

export interface FetchYearWeekendsPayload {
  year: number;
}

export interface WeekendHoliday {
  date: string; // Serialized Date
  name: string;
}

export interface MasterHolidayState {
  holidays: MasterHoliday[];
  weekends: WeekendHoliday[];
  loading: boolean;
  error: string | null;
  uploadedFiles: UploadedFileDto[];
  fileLoading: boolean;
}
