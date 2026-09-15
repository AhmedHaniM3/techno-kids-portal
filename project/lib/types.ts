export type Role = 'owner' | 'instructor' | 'parent';

export interface Profile {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  child_id: string | null;
  bio: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  category: string;
  age_range: string | null;
  instructor_id: string | null;
  fee: number;
  schedule_day: string | null;
  schedule_time: string | null;
  capacity: number;
  color: string;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  grade: string | null;
  parent_id: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  phone: string | null;
  enrollment_date: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'pending';
  progress_pct: number;
  enrolled_at: string;
}

export interface AttendanceRecord {
  id: string;
  enrollment_id: string;
  session_date: string;
  status: 'present' | 'absent' | 'late';
  created_at: string;
}

export interface ProgressNote {
  id: string;
  student_id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  body: string;
  sent_at: string;
}

export interface Material {
  id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface TuitionPayment {
  id: string;
  student_id: string;
  course_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  month_label: string;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
}

// Joined/extended types for UI
export interface CourseWithInstructor extends Course {
  instructor?: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null;
  enrollment_count?: number;
}

export interface StudentWithDetails extends Student {
  parent?: Pick<Profile, 'id' | 'name' | 'email' | 'phone'> | null;
  courses?: Pick<Course, 'id' | 'name' | 'color' | 'category'>[];
  enrollments?: Enrollment[];
}

export interface EnrollmentWithDetails extends Enrollment {
  course?: Course;
  student?: Student;
}

export interface ProgressNoteWithDetails extends ProgressNote {
  course?: Pick<Course, 'id' | 'name' | 'color'>;
  instructor?: Pick<Profile, 'id' | 'name' | 'avatar_url'>;
  student?: Pick<Student, 'id' | 'name' | 'avatar_url'>;
}

export interface MaterialWithDetails extends Material {
  course?: Pick<Course, 'id' | 'name' | 'color'>;
}

export interface TuitionWithDetails extends TuitionPayment {
  student?: Pick<Student, 'id' | 'name' | 'avatar_url'>;
  course?: Pick<Course, 'id' | 'name' | 'color'>;
}
