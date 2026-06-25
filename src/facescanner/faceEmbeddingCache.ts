const STORAGE_KEY = 'face-demo-embeddings';

export interface FaceEnrollmentRecord {
  employeeId: string;
  embedding: number[];
  dimension: number;
  enrolledAt: string;
  maxPoseDistance?: number;
}

function readStore(): Record<string, FaceEnrollmentRecord> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, FaceEnrollmentRecord>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, FaceEnrollmentRecord>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getEnrolledList(): FaceEnrollmentRecord[] {
  return Object.values(readStore()).sort(
    (a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime(),
  );
}

export function getEnrollment(employeeId: string): FaceEnrollmentRecord | undefined {
  return readStore()[employeeId];
}

export function saveEnrollment(record: FaceEnrollmentRecord) {
  const store = readStore();
  store[record.employeeId] = record;
  writeStore(store);
}

export function removeEnrollment(employeeId: string) {
  const store = readStore();
  delete store[employeeId];
  writeStore(store);
}
