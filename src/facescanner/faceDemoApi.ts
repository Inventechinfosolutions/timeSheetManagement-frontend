import axios from 'axios';

const apiUrl = '/api/demo/face';

export interface EnrollFaceResponse {
  success: boolean;
  employeeId: string;
  embedding: number[];
  dimension: number;
  maxPoseDistance: number;
  message: string;
}

export interface VerifyFaceResponse {
  match: boolean;
  distance?: number;
  threshold?: number;
  message?: string;
}

export async function enrollFace(
  employeeId: string,
  images: string[],
): Promise<EnrollFaceResponse> {
  const response = await axios.post<EnrollFaceResponse>(`${apiUrl}/enroll`, {
    employeeId,
    images,
  });
  return response.data;
}

export async function verifyFace(
  employeeId: string,
  embedding: number[],
  images: string[],
): Promise<VerifyFaceResponse> {
  const response = await axios.post<VerifyFaceResponse>(`${apiUrl}/verify`, {
    employeeId,
    embedding,
    images,
  });
  return response.data;
}
