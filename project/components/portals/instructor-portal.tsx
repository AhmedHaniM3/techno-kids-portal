'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import { useApp } from '@/lib/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  BookOpen, FileText,
  Upload, Phone, MessageSquare, Check, X, Users,
  Calendar, Plus, Download, File, Trash2
} from 'lucide-react';

interface InstructorPortalProps {
  currentUser?: any;
}

export default function InstructorPortal({ currentUser }: InstructorPortalProps = {}) {
  const [activeTab, setActiveTab] = useState('courses');
  const { user: contextUser } = useApp() as any;

  let activeUser = currentUser || contextUser;
  if (!activeUser && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) activeUser = JSON.parse(stored);
    } catch (e) {}
  }

  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let currentActiveUser = currentUser || contextUser;
      if (!currentActiveUser && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('currentUser');
          if (stored) currentActiveUser = JSON.parse(stored);
        } catch (e) {}
      }

      let coursesRes: any = { data: [] };
      let studentsRes: any = { data: [] };
      let notesRes: any = { data: [] };
      let materialsRes: any = { data: [] };
      let attendanceRes: any = { data: [] };
      let assignmentsRes: any = { data: [] };

      try { coursesRes = await supabase.from('courses').select('*'); } catch (e) {}
      try { studentsRes = await supabase.from('students').select('*'); } catch (e) {}
      try { notesRes = await supabase.from('notes').select('*').order('created_at', { ascending: false }); } catch (e) {}
      try { materialsRes = await supabase.from('materials').select('*').order('created_at', { ascending: false }); } catch (e) {}
      try { attendanceRes = await supabase.from('attendance').select('*'); } catch (e) {}
      try { assignmentsRes = await supabase.from('assignments').select('*').order('created_at', { ascending: false }); } catch (e) {}

      let dbCourses = coursesRes.data || [];
      let dbStudents = studentsRes.data || [];

      const instructorName = String(currentActiveUser?.name || '').trim().toLowerCase();
      const instructorUsername = String(currentActiveUser?.username || '').trim().toLowerCase();
      const instructorId = String(currentActiveUser?.id || '').trim();

      // Only show courses assigned to this instructor by the academy owner
      const myCourses = (dbCourses || []).filter((course: any) => {
        if (!course) return false;
        const cInstructor = String(course.instructor || '').trim().toLowerCase();
        if (!cInstructor || cInstructor === 'unassigned' || cInstructor === 'none') {
          return false;
        }
        const cInstructorId = String(course.instructor_id || '').trim();
        if (instructorId && cInstructorId && cInstructorId === instructorId) {
          return true;
        }
        return (
          (instructorName && cInstructor === instructorName) ||
          (instructorUsername && cInstructor === instructorUsername)
        );
      });

      let savedPlans: any = {};
      if (typeof window !== 'undefined') {
        try {
          savedPlans = JSON.parse(localStorage.getItem('tk_lesson_plans') || '{}');
        } catch (e) {}
      }

      const formattedCourses = myCourses.map((course: any, idx: number) => {
        const courseName = course.name || course.title || `Course ${idx + 1}`;
        const coursePlans = course.lesson_plans || savedPlans[course.id] || savedPlans[courseName] || { 1: '', 2: '', 3: '', 4: '' };
        
        const courseStudents = dbStudents.filter((s: any) => 
          s.course_name === courseName || 
          s.course_id === course.id
        );

        return {
          id: course.id || `course-${idx}`,
          name: courseName,
          schedule: course.schedule || course.day || 'Flexible Schedule',
          category: course.category || 'Technology',
          instructor: course.instructor || currentActiveUser?.name || 'Instructor',
          lessonPlans: coursePlans,
          lesson_plans: coursePlans,
          students: courseStudents.map((student: any, sIdx: number) => {
            const studentAtt = (attendanceRes.data || []).filter((a: any) => a.student_id === student.id || a.student_name === student.name);
            const sessions = [1, 2, 3, 4].map((sessionNum) => {
              const record = studentAtt.find((a: any) => Number(a.date) === sessionNum || Number(a.session) === sessionNum);
              return {
                session: sessionNum,
                status: record ? record.status : null,
                tag: record?.tag || null,
              };
            });

            const presentCount = sessions.filter((s: any) => s.status === 'present').length;
            const markedCount = sessions.filter((s: any) => s.status !== null).length;
            const attendanceRate = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;

            return {
              id: student.id || `student-${idx}-${sIdx}`,
              name: student.name || student.full_name || 'Unnamed Student',
              phone: student.phone || student.mobile || 'No phone',
              fees: student.fees || 0,
              parent_id: student.parent_id,
              course_name: courseName,
              sessions,
              attendanceRate,
            };
          }),
        };
      });

      let dbAssignments = assignmentsRes.data || [];
      if (dbAssignments.length === 0 && typeof window !== 'undefined') {
        try {
          dbAssignments = JSON.parse(localStorage.getItem('tk_assignments') || '[]');
        } catch (e) {}
      }

      setCoursesList(formattedCourses);
      setNotes(notesRes.data || []);
      setMaterials(materialsRes.data || []);
      setAssignments(dbAssignments);
    } catch (err) {
      console.error('Error loading instructor portal data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, contextUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500 font-medium">Loading instructor dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="[&_img]:h-12 [&_img]:w-auto [&_.logo]:scale-125">
        <Header roleLabel="Instructor Portal" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6 pt-6">
        <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-3">
          <Button
            size="sm"
            variant={activeTab === 'courses' ? 'default' : 'outline'}
            onClick={() => setActiveTab('courses')}
            className={activeTab === 'courses' ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' : 'text-slate-700 cursor-pointer'}
          >
            <BookOpen className="h-4 w-4 mr-2" /> My Courses & Attendance
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'assignments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('assignments')}
            className={activeTab === 'assignments' ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' : 'text-slate-700 cursor-pointer'}
          >
            <FileText className="h-4 w-4 mr-2" /> Assignments & Homework
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'notes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('notes')}
            className={activeTab === 'notes' ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' : 'text-slate-700 cursor-pointer'}
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Progress Notes
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'materials' ? 'default' : 'outline'}
            onClick={() => setActiveTab('materials')}
            className={activeTab === 'materials' ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' : 'text-slate-700 cursor-pointer'}
          >
            <Upload className="h-4 w-4 mr-2" /> Materials
          </Button>
        </div>

        {activeTab === 'courses' && <CoursesTab courses={coursesList} reload={loadData} />}
        {activeTab === 'assignments' && <AssignmentsTab courses={coursesList} assignments={assignments} reload={loadData} />}
        {activeTab === 'notes' && <NotesTab courses={coursesList} notes={notes} reload={loadData} instructorName={activeUser?.name || 'Instructor'} />}
        {activeTab === 'materials' && <MaterialsTab courses={coursesList} materials={materials} reload={loadData} />}
      </main>
    </div>
  );
}

function CoursesTab({ courses, reload }: { courses: any[]; reload: () => void }) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(courses[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'plans'>('attendance');
  const [selectedSessionTagModal, setSelectedSessionTagModal] = useState<{ studentId: string; sessionNum: number; currentStatus: string | null; currentTag: string | null } | null>(null);
  const [lessonPlansInput, setLessonPlansInput] = useState<{ [courseId: string]: { [session: number]: string } }>({});
  const { toast } = useToast();

  async function handleSessionUpdate(studentId: string, sessionNum: number, status: string | null, tag: string | null) {
    try {
      await supabase.from('attendance').delete().eq('student_id', studentId).eq('date', String(sessionNum));
    } catch (e) {}

    if (status !== null) {
      const payload: any = {
        student_id: studentId,
        status: status,
        date: String(sessionNum),
        tag: tag
      };

      let error: any = null;
      try {
        const res = await supabase.from('attendance').insert([payload]);
        error = res.error;
      } catch (err: any) {
        error = { message: err?.message };
      }
      
      if (error && error.message && error.message.includes('tag')) {
        delete payload.tag;
        try {
          const retry = await supabase.from('attendance').insert([payload]);
          error = retry.error;
        } catch (err: any) {
          error = { message: err?.message };
        }
      }

      if (error) {
        toast({ title: 'Error', description: error.message || 'Failed to update attendance', variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Attendance Updated', description: `Session ${sessionNum} updated successfully.` });
    setSelectedSessionTagModal(null);
    reload();
  }

  async function saveLessonPlan(courseId: string, courseName: string) {
    const plans = lessonPlansInput[courseId];
    if (!plans) return;

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('tk_lesson_plans') || '{}');
        stored[courseId] = { ...(stored[courseId] || {}), ...plans };
        if (courseName) {
          stored[courseName] = { ...(stored[courseName] || {}), ...plans };
        }
        localStorage.setItem('tk_lesson_plans', JSON.stringify(stored));
      } catch (e) {}
    }

    try {
      await supabase.from('courses').update({ lesson_plans: plans }).eq('title', courseName);
    } catch (e) {}
    try {
      await supabase.from('courses').update({ lesson_plans: plans }).eq('name', courseName);
    } catch (e) {}
    try {
      await supabase.from('courses').update({ lesson_plans: plans }).eq('id', courseId);
    } catch (e) {}
    
    toast({ title: 'Lesson Plan Saved', description: 'Session notes have been updated successfully.' });
    reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Courses, Attendance & Lesson Plans</h2>
        <p className="text-sm text-slate-500">Track student attendance, performance tags, and maintain session lesson plans</p>
      </div>

      {courses.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-xl bg-white shadow-sm">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">No courses assigned to you yet</p>
          <p className="text-sm text-slate-500 mt-1">When the academy owner assigns you to a course, it will appear here.</p>
        </div>
      ) : (
        courses.map((course: any) => (
          <Card key={course.id} className="overflow-hidden border-slate-200 shadow-sm bg-white">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2 text-xs">{course.category}</Badge>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription className="mt-1">Schedule: {course.schedule} · Instructor: {course.instructor}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{course.students.length}</p>
                  <p className="text-xs text-slate-500">students</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                {expandedCourse === course.id ? 'Hide course management' : 'Manage Roster, Attendance & Lesson Plans'}
              </button>

              {expandedCourse === course.id && (
                <div className="mt-6 space-y-6 border-t pt-4">
                  <div className="flex gap-2 border-b pb-3">
                    <Button
                      size="sm"
                      variant={activeSubTab === 'attendance' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab('attendance')}
                      className={activeSubTab === 'attendance' ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' : 'cursor-pointer'}
                    >
                      <Users className="h-4 w-4 mr-1.5" /> Attendance & Quick-Tags
                    </Button>
                    <Button
                      size="sm"
                      variant={activeSubTab === 'plans' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab('plans')}
                      className={activeSubTab === 'plans' ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' : 'cursor-pointer'}
                    >
                      <Calendar className="h-4 w-4 mr-1.5" /> Session Lesson Plans (S1–S4)
                    </Button>
                  </div>

                  {activeSubTab === 'attendance' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500">Click any session tile (S1–S4) to mark attendance and assign behavioral badges.</p>
                      {course.students.length === 0 && (
                        <p className="text-sm text-slate-400">No students found for this course.</p>
                      )}
                      {course.students.map((student: any) => (
                        <div key={student.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-lg border border-slate-100 p-4 bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-100">
                              <AvatarFallback className="bg-slate-100 text-sm font-semibold">
                                {student.name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {student.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
                            <div className="flex items-center gap-2">
                              {student.sessions.map((s: any) => {
                                let bgClass = 'bg-white border-slate-200 text-slate-600 hover:border-slate-300';
                                if (s.status === 'present') bgClass = 'bg-emerald-500 border-emerald-600 text-white shadow-sm';
                                if (s.status === 'absent') bgClass = 'bg-red-500 border-red-600 text-white shadow-sm';

                                return (
                                  <button
                                    key={s.session}
                                    onClick={() => setSelectedSessionTagModal({ studentId: student.id, sessionNum: s.session, currentStatus: s.status, currentTag: s.tag })}
                                    title={`Session ${s.session}: ${s.status || 'Unmarked'}${s.tag ? ` | Tag: ${s.tag}` : ''}. Click to edit.`}
                                    className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-lg border font-medium text-xs cursor-pointer transition-all ${bgClass}`}
                                  >
                                    <span className="text-[10px] opacity-80 uppercase tracking-wider">S{s.session}</span>
                                    <span className="text-sm font-bold flex items-center gap-0.5">
                                      {s.status === 'present' && <Check className="h-4 w-4" />}
                                      {s.status === 'absent' && <X className="h-4 w-4" />}
                                      {s.status === null && '-'}
                                    </span>
                                    {s.tag && (
                                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] text-white shadow">
                                        {s.tag === 'star' && '⭐'}
                                        {s.tag === 'creative' && '💡'}
                                        {s.tag === 'focus' && '⚠️'}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-xs font-semibold text-slate-600 pl-2 border-l">
                              Rate: <span className="text-emerald-600">{student.attendanceRate}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSubTab === 'plans' && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500">Record what topics, lab exercises, or milestones are covered in each session.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[1, 2, 3, 4].map((sessionNum) => {
                          const currentVal = lessonPlansInput[course.id]?.[sessionNum] ?? course.lessonPlans?.[sessionNum] ?? course.lesson_plans?.[sessionNum] ?? '';
                          return (
                            <div key={sessionNum} className="space-y-1.5 p-3 rounded-lg border bg-slate-50/50">
                              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Session {sessionNum} Agenda & Notes
                              </Label>
                              <Textarea
                                placeholder={`Enter lesson plan for Session ${sessionNum}...`}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLessonPlansInput(prev => ({
                                    ...prev,
                                    [course.id]: {
                                      ...(prev[course.id] || course.lesson_plans || {}),
                                      [sessionNum]: val
                                    }
                                  }));
                                }}
                                rows={3}
                                className="text-xs bg-white"
                              />
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveLessonPlan(course.id, course.name)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        Save Lesson Plans
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {selectedSessionTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">
              Manage Session {selectedSessionTagModal.sessionNum} Details
            </h3>
            <p className="text-xs text-slate-500">Set attendance status and assign an optional performance badge.</p>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Attendance Status</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={selectedSessionTagModal.currentStatus === 'present' ? 'default' : 'outline'}
                  onClick={() => setSelectedSessionTagModal(prev => prev ? { ...prev, currentStatus: 'present' } : null)}
                  className={`cursor-pointer ${selectedSessionTagModal.currentStatus === 'present' ? 'bg-emerald-600 text-white' : ''}`}
                >
                  <Check className="h-4 w-4 mr-1" /> Present
                </Button>
                <Button
                  type="button"
                  variant={selectedSessionTagModal.currentStatus === 'absent' ? 'default' : 'outline'}
                  onClick={() => setSelectedSessionTagModal(prev => prev ? { ...prev, currentStatus: 'absent' } : null)}
                  className={`cursor-pointer ${selectedSessionTagModal.currentStatus === 'absent' ? 'bg-red-600 text-white' : ''}`}
                >
                  <X className="h-4 w-4 mr-1" /> Absent
                </Button>
                <Button
                  type="button"
                  variant={selectedSessionTagModal.currentStatus === null ? 'default' : 'outline'}
                  onClick={() => setSelectedSessionTagModal(prev => prev ? { ...prev, currentStatus: null, currentTag: null } : null)}
                  className="cursor-pointer"
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Behavioral & Performance Quick-Tag</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={selectedSessionTagModal.currentTag === 'star' ? 'default' : 'outline'}
                  onClick={() => setSelectedSessionTagModal(prev => prev ? { ...prev, currentTag: prev.currentTag === 'star' ? null : 'star' } : null)}
                  className={`text-xs cursor-pointer ${selectedSessionTagModal.currentTag === 'star' ? 'bg-amber-500 text-white' : ''}`}
                >
                  ⭐ Star
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={selectedSessionTagModal.currentTag === 'creative' ? 'default' : 'outline'}
                  onClick={() => setSelectedSessionTagModal(prev => prev ? { ...prev, currentTag: prev.currentTag === 'creative' ? null : 'creative' } : null)}
                  className={`text-xs cursor-pointer ${selectedSessionTagModal.currentTag === 'creative' ? 'bg-blue-500 text-white' : ''}`}
                >
                  💡 Creative
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={selectedSessionTagModal.currentTag === 'focus' ? 'default' : 'outline'}
                  onClick={() => setSelectedSessionTagModal(prev => prev ? { ...prev, currentTag: prev.currentTag === 'focus' ? null : 'focus' } : null)}
                  className={`text-xs cursor-pointer ${selectedSessionTagModal.currentTag === 'focus' ? 'bg-orange-500 text-white' : ''}`}
                >
                  ⚠️ Focus
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setSelectedSessionTagModal(null)} className="cursor-pointer">Cancel</Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                onClick={() => handleSessionUpdate(
                  selectedSessionTagModal.studentId,
                  selectedSessionTagModal.sessionNum,
                  selectedSessionTagModal.currentStatus,
                  selectedSessionTagModal.currentTag
                )}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentsTab({ courses, assignments, reload }: { courses: any[]; assignments: any[]; reload: () => void }) {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<any[]>([]);

  async function handleCreateAssignment() {
    if (!selectedCourse || !title.trim() || !dueDate) {
      toast({ title: 'Missing information', description: 'Please select a course, title, and due date.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const courseObj = courses.find((c: any) => c.id === selectedCourse);
    const courseName = courseObj?.name || 'General';

    const newAsn = {
      id: `asn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate,
      course_name: courseName,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('assignments').insert([newAsn]);
    } catch (e) {}

    try {
      const existing = JSON.parse(localStorage.getItem('tk_assignments') || '[]');
      localStorage.setItem('tk_assignments', JSON.stringify([newAsn, ...existing]));
    } catch (e) {}

    toast({ title: 'Assignment Posted!', description: 'Students and parents can now view this assignment.' });
    setTitle('');
    setDescription('');
    setDueDate('');
    setSubmitting(false);
    reload();
  }

  async function handleClearAllAssignments() {
    if (!window.confirm('Are you sure you want to clear all assignments? This will remove them for students and parents.')) return;
    try {
      await supabase.from('assignments').delete().not('id', 'is', null);
    } catch (e) {}
    try {
      await supabase.from('submissions').delete().not('id', 'is', null);
    } catch (e) {}
    try {
      localStorage.removeItem('tk_assignments');
      localStorage.removeItem('tk_submissions');
    } catch (e) {}
    toast({ title: 'Assignments Cleared', description: 'All assignments have been cleared for students and parents.' });
    reload();
  }

  async function handleDeleteAssignment(id: string) {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await supabase.from('assignments').delete().eq('id', id);
    } catch (e) {}
    try {
      await supabase.from('submissions').delete().eq('assignment_id', id);
    } catch (e) {}
    try {
      const existing = JSON.parse(localStorage.getItem('tk_assignments') || '[]');
      localStorage.setItem('tk_assignments', JSON.stringify(existing.filter((a: any) => a.id !== id)));
    } catch (e) {}
    toast({ title: 'Assignment Deleted', description: 'Assignment removed.' });
    reload();
  }

  async function loadSubmissions(assignment: any) {
    setSelectedAssignment(assignment);
    const courseObj = courses.find((c: any) => c.name === assignment.course_name);
    const students = courseObj ? courseObj.students : courses.flatMap(c => c.students);

    let dbSubs: any[] = [];
    try {
      const res = await supabase.from('submissions').select('*').eq('assignment_id', assignment.id);
      dbSubs = res.data || [];
    } catch (e) {}

    const mapped = students.map((st: any) => {
      const sub = (dbSubs || []).find((s: any) => s.student_id === st.id);
      return {
        student_id: st.id,
        student_name: st.name,
        status: sub ? sub.status : 'pending',
      };
    });
    setStudentSubmissions(mapped);
  }

  async function updateSubmissionStatus(studentId: string, newStatus: string) {
    setStudentSubmissions(prev => prev.map(s => s.student_id === studentId ? { ...s, status: newStatus } : s));

    try {
      await supabase.from('submissions').delete().eq('assignment_id', selectedAssignment.id).eq('student_id', studentId);
    } catch (e) {}
    try {
      await supabase.from('submissions').insert([{
        assignment_id: selectedAssignment.id,
        student_id: studentId,
        status: newStatus
      }]);
    } catch (e) {}
    toast({ title: 'Status Updated', description: 'Student submission status recorded.' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Assignments & Homework Submissions</h2>
        <p className="text-sm text-slate-500">Create project tasks and track student submission statuses</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Post New Assignment
            </CardTitle>
            <CardDescription>Assign homework or project milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asn-course">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger id="asn-course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <SelectItem value="none" disabled>No courses assigned to you</SelectItem>
                  ) : (
                    courses.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asn-title">Assignment Title</Label>
              <Input
                id="asn-title"
                placeholder="e.g., Build Ultrasonic Distance Sensor Circuit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asn-desc">Instructions / Description</Label>
              <Textarea
                id="asn-desc"
                placeholder="Provide details and expectations…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asn-date">Due Date</Label>
              <Input
                id="asn-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <Button onClick={handleCreateAssignment} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Publish Assignment
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">Active Assignments</CardTitle>
              <CardDescription>{assignments.length} assignments posted</CardDescription>
            </div>
            {assignments.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllAssignments}
                className="gap-1.5 h-8 text-xs cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All Assignments
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {assignments.length === 0 && (
              <p className="text-sm text-slate-400 py-8 text-center">No assignments posted yet.</p>
            )}
            {assignments.map((asn) => (
              <div key={asn.id} className="rounded-lg border border-slate-100 p-3.5 hover:bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{asn.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{asn.course_name}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteAssignment(asn.id)}
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      title="Delete assignment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {asn.description && <p className="text-xs text-slate-600 line-clamp-2">{asn.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-emerald-600" /> Due: {asn.due_date}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => loadSubmissions(asn)} className="h-7 text-xs cursor-pointer">
                    View Submissions
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedAssignment.title}</h3>
                <p className="text-xs text-slate-500">{selectedAssignment.course_name} · Due: {selectedAssignment.due_date}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setSelectedAssignment(null)} className="cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {studentSubmissions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No students found.</p>
              ) : (
                studentSubmissions.map((sub) => (
                  <div key={sub.student_id} className="flex items-center justify-between rounded-lg border p-3 bg-slate-50/50">
                    <span className="text-sm font-medium text-slate-900">{sub.student_name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={sub.status === 'submitted' ? 'default' : 'secondary'} className="text-xs">
                        {sub.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant={sub.status === 'submitted' ? 'outline' : 'default'}
                        className={`cursor-pointer ${sub.status === 'submitted' ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                        onClick={() => updateSubmissionStatus(sub.student_id, sub.status === 'submitted' ? 'pending' : 'submitted')}
                      >
                        {sub.status === 'submitted' ? 'Mark Pending' : 'Mark Submitted'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesTab({ courses, notes, reload, instructorName }: { courses: any[]; notes: any[]; reload: () => void; instructorName: string }) {
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allStudents = courses.flatMap((c: any) => c.students);

  async function handleSendNote() {
    if (!selectedStudentId || !message.trim()) {
      toast({ title: 'Missing details', description: 'Please select a student and write a message.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const student = allStudents.find((s: any) => s.id === selectedStudentId);
    const courseName = student?.course_name || 'General Course';

    const payload = {
      title: `Progress Note: ${student?.name || 'Student'}`,
      body: message.trim(),
      course_name: courseName,
      instructor_name: instructorName,
      student_id: selectedStudentId,
    };

    let error: any = null;
    try {
      const res = await supabase.from('notes').insert([payload]);
      error = res.error;
    } catch (err: any) {
      error = { message: err?.message };
    }

    if (error) {
      console.error('Error inserting note:', error);
      toast({ title: 'Error', description: error.message || 'Could not send note.', variant: 'destructive' });
    } else {
      toast({ title: 'Progress Note Sent!', description: 'The parent can now view this update.' });
      setMessage('');
      setSelectedStudentId('');
    }
    setSubmitting(false);
    reload();
  }

  async function handleClearAllNotes() {
    if (!window.confirm('Are you sure you want to clear all progress notes? This will remove all sent messages from both instructor and parent portals.')) return;
    try {
      const { error } = await supabase.from('notes').delete().not('id', 'is', null);
      if (error) {
        await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      toast({ title: 'Messages Cleared', description: 'All progress notes have been cleared for parents.' });
      reload();
    } catch (err: any) {
      console.error('Error clearing notes:', err);
      toast({ title: 'Error', description: 'Could not clear notes from database.', variant: 'destructive' });
    }
  }

  async function handleDeleteNote(id: string) {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Message Deleted', description: 'The note has been removed.' });
      reload();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not delete note.', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Student Progress Notes</h2>
        <p className="text-sm text-slate-500">Share feedback and progress updates with parents</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Write New Progress Note</CardTitle>
            <CardDescription>Select a student and send an update</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-student">Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger id="note-student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {allStudents.length === 0 ? (
                    <SelectItem value="none" disabled>No students enrolled in your courses</SelectItem>
                  ) : (
                    allStudents.map((st: any) => (
                      <SelectItem key={st.id} value={st.id}>{st.name}{st.course_name ? ` (${st.course_name})` : ''}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-msg">Message</Label>
              <Textarea
                id="note-msg"
                placeholder="Write progress feedback or observations..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={handleSendNote} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
              Send Progress Note
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">Recent Notes Sent</CardTitle>
              <CardDescription>{notes.length} total notes recorded</CardDescription>
            </div>
            {notes.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllNotes}
                className="gap-1.5 h-8 text-xs cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All Messages
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {notes.length === 0 && (
              <p className="text-sm text-slate-400 py-8 text-center">No progress notes sent yet.</p>
            )}
            {notes.map((note: any, idx: number) => {
              const matchedStudent = allStudents.find((s: any) => s.id === note.student_id);
              const displayName = matchedStudent?.name || note.title?.replace(/^Progress Note:\s*/i, '') || note.student_name || 'Student';
              const displayMsg = note.body || note.message;
              const displayInstructor = note.instructor_name || note.instructor || 'Instructor';

              return (
                <div key={note.id || idx} className="rounded-lg border p-3.5 space-y-1.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{displayName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{new Date(note.created_at || Date.now()).toLocaleDateString()}</span>
                      {note.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{displayMsg}</p>
                  <p className="text-[10px] text-slate-400">By {displayInstructor} · {note.course_name || 'General'}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MaterialsTab({ courses, materials, reload }: { courses: any[]; materials: any[]; reload: () => void }) {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUploadMaterial() {
    if (!selectedCourse || !title.trim() || !fileToUpload) {
      toast({ title: 'Missing fields', description: 'Please select a course, title, and choose a file to upload.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const courseObj = courses.find((c: any) => c.id === selectedCourse);
    const courseName = courseObj?.name || 'General';

    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const randomStr = Math.random().toString(36).substring(2, 7);
      const filePath = `${Date.now()}-${randomStr}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData?.publicUrl;
      if (!fileUrl) {
        throw new Error('Could not get public URL for uploaded file.');
      }

      // Insert record into 'materials' table matching your schema columns
      const { error: dbError } = await supabase.from('materials').insert([{
        title: title.trim(),
        course_name: courseName,
        file_url: fileUrl
      }]);

      if (dbError) {
        throw new Error(dbError.message);
      }

      toast({ title: 'Upload Successful!', description: `${fileToUpload.name} has been published.` });
      setTitle('');
      setSelectedCourse('');
      setFileToUpload(null);
      reload();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ 
        title: 'Upload Failed', 
        description: err.message || 'An error occurred during upload.', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleClearAllMaterials() {
    if (!window.confirm('Are you sure you want to clear all uploaded materials? This will remove all materials from the parent resources tab as well.')) return;
    try {
      const { error } = await supabase.from('materials').delete().not('id', 'is', null);
      if (error) {
        await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      toast({ title: 'Materials Cleared', description: 'All materials have been cleared for parents.' });
      reload();
    } catch (err: any) {
      console.error('Error clearing materials:', err);
      toast({ title: 'Error', description: 'Could not clear materials.', variant: 'destructive' });
    }
  }

  async function handleDeleteMaterial(id: string) {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Material Deleted', description: 'File removed from published materials.' });
      reload();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not delete material.', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Course Materials & Document Uploads</h2>
        <p className="text-sm text-slate-500">Upload actual files, lectures, and resources for parents and students</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-4 w-4 text-emerald-600" />
              Upload Material File
            </CardTitle>
            <CardDescription>Select a course and upload your document or resource file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mat-course">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger id="mat-course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <SelectItem value="none" disabled>No courses assigned to you</SelectItem>
                  ) : (
                    courses.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mat-title">Material Title / Description</Label>
              <Input
                id="mat-title"
                placeholder="e.g., Week 1 Slides & Circuit Schematics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mat-file">Select File (PDF, ZIP, DOCX, Images)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="mat-file"
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  className="cursor-pointer file:cursor-pointer file:bg-emerald-50 file:text-emerald-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:text-xs file:font-semibold"
                />
              </div>
              {fileToUpload && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <File className="h-3 w-3" /> Selected: {fileToUpload.name} ({(fileToUpload.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <Button onClick={handleUploadMaterial} disabled={uploading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading to Cloud...' : 'Upload & Publish to Parents'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">Published Materials</CardTitle>
              <CardDescription>{materials.length} files available</CardDescription>
            </div>
            {materials.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllMaterials}
                className="gap-1.5 h-8 text-xs cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All Materials
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {materials.length === 0 && (
              <p className="text-sm text-slate-400 py-8 text-center">No materials uploaded yet.</p>
            )}
            {materials.map((mat: any, idx: number) => {
              const displayFileName = mat.description || (mat.file_url ? mat.file_url.split('/').pop()?.replace(/^\d+-[a-z0-9]+\./i, '.') : '') || mat.title || 'Attached File';
              return (
                <div key={mat.id || idx} className="flex items-center justify-between rounded-lg border p-3.5 bg-slate-50/50 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{mat.title}</p>
                      <Badge variant="secondary" className="text-[10px]">{mat.course_name}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <File className="h-3 w-3 text-emerald-600" /> {mat.file_name || displayFileName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mat.file_url && mat.file_url !== '#' && (
                      <Button size="sm" variant="outline" asChild className="h-8 text-xs cursor-pointer">
                        <a href={mat.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-3.5 w-3.5 mr-1" /> Download
                        </a>
                      </Button>
                    )}
                    {mat.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteMaterial(mat.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}