export enum UserRole {
  FARMER = 'FARMER',
  CENTRE_OPERATOR = 'CENTRE_OPERATOR',
  CENTRE_MANAGER = 'CENTRE_MANAGER',
  QUALITY_OFFICER = 'QUALITY_OFFICER',
  WEIGHMENT_OPERATOR = 'WEIGHMENT_OPERATOR',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
}

export enum TokenStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  DELAYED = 'DELAYED',
  EXTENDED = 'EXTENDED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum QueueStatus {
  NOT_STARTED = 'NOT_STARTED',
  SCHEDULED = 'SCHEDULED',
  APPROACHING = 'APPROACHING',
  CHECK_IN_OPEN = 'CHECK_IN_OPEN',
  CHECKED_IN = 'CHECKED_IN',
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum QualityStatus {
  PENDING = 'PENDING',
  TESTING = 'TESTING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  RETEST_REQUIRED = 'RETEST_REQUIRED',
}

export enum QualityGrade {
  GRADE_A = 'GRADE_A',
  GRADE_B = 'GRADE_B',
  GRADE_C = 'GRADE_C',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  NOT_INITIATED = 'NOT_INITIATED',
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  ON_HOLD = 'ON_HOLD',
}

export enum CongestionLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  centreId?: string | null;
  farmerId?: string | null;
}

export interface CongestionResult {
  centreId: string;
  congestionLevel: CongestionLevel;
  waitingFarmersCount: number;
  checkedInCount: number;
  activeCounters: number;
  averageServiceMinutes: number;
  estimatedWaitMinutes: number;
  currentDelayMinutes: number;
  suggestedArrivalShiftMinutes: number;
  contributingFactors: string[];
}
