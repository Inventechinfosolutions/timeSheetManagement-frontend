import axios from 'axios';

const apiUrl = '/api/employee-details';

export interface FaceActionResponse {
  success: boolean;
  employeeId: string;
  message: string;
  verified?: boolean;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Request failed';
}

export async function isFaceEnrolled(employeeId: string): Promise<boolean> {
  const response = await axios.get<boolean>(`${apiUrl}/face/is-face-enrolled/${employeeId}`);
  return response.data;
}

export async function enrollFace(employeeId: string, images: string[]): Promise<FaceActionResponse> {
  const response = await axios.post<FaceActionResponse>(`${apiUrl}/face/enroll-face/${employeeId}`, {
    employeeId,
    images,
  });
  return response.data;
}

export async function checkin(employeeId: string, images: string[]): Promise<FaceActionResponse> {
  const response = await axios.post<FaceActionResponse>(`${apiUrl}/face/checkin/${employeeId}`, {
    employeeId,
    checkingInTime: new Date(),
    images,
  });
  return response.data;
}

export async function checkout(employeeId: string, images: string[]): Promise<FaceActionResponse> {
  const response = await axios.post<FaceActionResponse>(`${apiUrl}/face/checkout/${employeeId}`, {
    employeeId,
    checkingOutTime: new Date(),
    images,
  });
  return response.data;
}
