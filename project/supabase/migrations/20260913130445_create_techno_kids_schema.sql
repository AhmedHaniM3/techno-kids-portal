/*
# Techno Kids Kafr Abdo — Database Schema

## Overview
Creates the full schema for a multi-role education management platform with three user types: owner, instructor, and parent. Uses a single-tenant model (no Supabase auth) so the role-switcher on the login screen can instantly switch between portals for testing.

## New Tables
1. profiles — Users with role, name, email, avatar, phone, child link
2. courses — Course catalog with instructor assignment, fee, schedule, color
3. students — Enrolled kids with parent link
4. enrollments — Student↔course link with status and progress
5. attendance — Per-session attendance records
6. progress_notes — Messages from instructors to parents
7. materials — Uploaded lesson resources (PDFs, homework sheets)
8. tuition_payments — Payment tracking with status and due dates

## Security
- RLS enabled on all tables with anon+authenticated full CRUD (single-tenant demo with role-switcher)
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('owner', 'instructor', 'parent')),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  avatar_url text,
  child_id uuid,
  bio text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  age_range text,
  instructor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  fee numeric(10,2) NOT NULL DEFAULT 0,
  schedule_day text,
  schedule_time text,
  capacity int NOT NULL DEFAULT 15,
  color text NOT NULL DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age int NOT NULL,
  grade text,
  parent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  avatar_url text,
  enrollment_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_child_fk') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_child_fk
      FOREIGN KEY (child_id) REFERENCES students(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'pending')),
  progress_pct int NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progress_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tuition_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  month_label text NOT NULL,
  due_date date,
  paid_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_payments ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE TO anon, authenticated USING (true);

-- courses policies
DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE TO anon, authenticated USING (true);

-- students policies
DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);

-- enrollments policies
DROP POLICY IF EXISTS "anon_select_enrollments" ON enrollments;
CREATE POLICY "anon_select_enrollments" ON enrollments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_enrollments" ON enrollments;
CREATE POLICY "anon_insert_enrollments" ON enrollments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_enrollments" ON enrollments;
CREATE POLICY "anon_update_enrollments" ON enrollments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_enrollments" ON enrollments;
CREATE POLICY "anon_delete_enrollments" ON enrollments FOR DELETE TO anon, authenticated USING (true);

-- attendance policies
DROP POLICY IF EXISTS "anon_select_attendance" ON attendance;
CREATE POLICY "anon_select_attendance" ON attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
CREATE POLICY "anon_insert_attendance" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
CREATE POLICY "anon_update_attendance" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;
CREATE POLICY "anon_delete_attendance" ON attendance FOR DELETE TO anon, authenticated USING (true);

-- progress_notes policies
DROP POLICY IF EXISTS "anon_select_notes" ON progress_notes;
CREATE POLICY "anon_select_notes" ON progress_notes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notes" ON progress_notes;
CREATE POLICY "anon_insert_notes" ON progress_notes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notes" ON progress_notes;
CREATE POLICY "anon_update_notes" ON progress_notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notes" ON progress_notes;
CREATE POLICY "anon_delete_notes" ON progress_notes FOR DELETE TO anon, authenticated USING (true);

-- materials policies
DROP POLICY IF EXISTS "anon_select_materials" ON materials;
CREATE POLICY "anon_select_materials" ON materials FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_materials" ON materials;
CREATE POLICY "anon_insert_materials" ON materials FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_materials" ON materials;
CREATE POLICY "anon_update_materials" ON materials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_materials" ON materials;
CREATE POLICY "anon_delete_materials" ON materials FOR DELETE TO anon, authenticated USING (true);

-- tuition_payments policies
DROP POLICY IF EXISTS "anon_select_tuition" ON tuition_payments;
CREATE POLICY "anon_select_tuition" ON tuition_payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tuition" ON tuition_payments;
CREATE POLICY "anon_insert_tuition" ON tuition_payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tuition" ON tuition_payments;
CREATE POLICY "anon_update_tuition" ON tuition_payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tuition" ON tuition_payments;
CREATE POLICY "anon_delete_tuition" ON tuition_payments FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_notes_student ON progress_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_course ON progress_notes(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_course ON materials(course_id);
CREATE INDEX IF NOT EXISTS idx_tuition_student ON tuition_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
