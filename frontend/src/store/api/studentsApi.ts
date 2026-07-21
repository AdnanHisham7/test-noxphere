import { baseApi } from './baseApi';

export type SelectionStatus = 'pending' | 'shortlisted' | 'on_hold' | 'selected' | 'not_selected' | 'released';
export type TransferStatus = 'not_listed' | 'listed' | 'sold';

export interface MedicalInfo {
  bloodGroup?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface GuardianInfo {
  name: string;
  phone: string;
  email: string;
}

export interface Student {
  id: string;
  userId: string;
  franchiseId: string;
  teamId?: string;
  coachId?: string;
  guardianIds: string[];
  guardian: GuardianInfo;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageGroup: string;
  jerseyNumber?: number;
  jerseySize?: string;
  position?: string;
  photo?: string;
  medicalInfo: MedicalInfo;
  enrollmentDate: string;
  isActive: boolean;
  attendancePercentage: number;
  overallRating: number;
  selectionStatus: SelectionStatus;
  selectionPhase?: string;
  selectionFeedback?: string;
  transferStatus: TransferStatus;
  transferPrice?: number;
  transferListedAt?: string;
  transferNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentBody {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO datetime
  ageGroup: string;
  franchiseId: string;
  teamId?: string;
  coachId?: string;
  jerseyNumber?: number;
  jerseySize?: string;
  position?: string;
  guardian: GuardianInfo;
  medicalInfo: MedicalInfo;
}

export interface StudentPerformanceRecord {
  _id: string;
  sessionDate: string;
  skillScores: { parameter: string; score: number }[];
  overallScore: number;
  remarks?: string;
  videoUrl?: string;
  coachId?: { firstName: string; lastName: string };
}

export interface PlayerCard {
  student: Student;
  performances: StudentPerformanceRecord[];
  attendance: { sessionDate: string; status: string; remarks?: string }[];
  remarks: { _id: string; text: string; date: string; coachId?: { firstName: string; lastName: string } }[];
}

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<
      { items: Student[]; total: number },
      { franchiseId: string; page?: number; limit?: number; search?: string; teamId?: string; ageGroup?: string; selectionStatus?: string }
    >({
      query: ({ franchiseId, page = 1, limit = 20, search, teamId, ageGroup, selectionStatus }) => ({
        url: '/students',
        params: { franchiseId, page, limit, search, teamId, ageGroup, selectionStatus },
      }),
      transformResponse: (res: { data: { items: Student[]; total: number } }) => res.data,
      providesTags: (result) =>
        result
          ? [...result.items.map((s) => ({ type: 'Student' as const, id: s.id })), { type: 'Student', id: 'LIST' }]
          : [{ type: 'Student', id: 'LIST' }],
    }),
    getStudentById: builder.query<Student, string>({
      query: (id) => `/students/${id}`,
      transformResponse: (res: { data: Student }) => res.data,
      providesTags: (_, __, id) => [{ type: 'Student', id }],
    }),
    createStudent: builder.mutation<Student, CreateStudentBody>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      transformResponse: (res: { data: Student }) => res.data,
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    updateStudent: builder.mutation<Student, { id: string; data: Partial<CreateStudentBody> }>({
      query: ({ id, data }) => ({ url: `/students/${id}`, method: 'PUT', body: data }),
      transformResponse: (res: { data: Student }) => res.data,
      invalidatesTags: (_, __, { id }) => [{ type: 'Student', id }, { type: 'Student', id: 'LIST' }],
    }),
    deleteStudent: builder.mutation<void, string>({
      query: (id) => ({ url: `/students/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'Student', id }, { type: 'Student', id: 'LIST' }],
    }),
    // NOTE: addPerformance/markAttendance used to live here as freeform
    // per-student writes. Attendance/performance are now only recorded
    // against a real scheduled session — see scheduleApi's
    // markSessionAttendance/logSessionPerformance.
    addCoachRemark: builder.mutation<unknown, { id: string; data: { text: string } }>({
      query: ({ id, data }) => ({ url: `/students/${id}/remarks`, method: 'POST', body: data }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Student', id }],
    }),
    listOnTransfer: builder.mutation<unknown, { id: string; data: { price: number; note?: string } }>({
      query: ({ id, data }) => ({ url: `/students/${id}/transfer`, method: 'POST', body: data }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Student', id }, 'Transfer'],
    }),
    getPlayerCard: builder.query<PlayerCard, string>({
      query: (id) => `/students/${id}/playercard`,
      transformResponse: (res: { data: PlayerCard }) => res.data,
      providesTags: (_, __, id) => [{ type: 'Performance', id }],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useAddCoachRemarkMutation,
  useListOnTransferMutation,
  useGetPlayerCardQuery,
} = studentsApi;
