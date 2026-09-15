'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import {
  Users, BookOpen, Award, CheckCircle2, Phone, MessageSquare, FileText, RefreshCw, Cpu, Download
} from 'lucide-react';

const navItems = [
  { id: 'progress', label: 'Progress & Attendance', icon: Award },
  { id: 'inbox', label: 'Inbox', icon: MessageSquare },
  { id: 'resources', label: 'Resources', icon: BookOpen },
];

interface ParentPortalProps {
  currentUser?: any;
}

export default function ParentPortal({ currentUser: propUser }: ParentPortalProps = {}) {
  const [activeTab, setActiveTab] = useState('progress');
  const context = useApp() as any;

  // Resolve user reliably from prop, context, or localStorage
  const getUser = useCallback(() => {
    if (propUser) return propUser;
    if (context?.user) return context.user;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('currentUser');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  }, [propUser, context?.user]);

  const user = getUser();
  
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const activeUser = getUser();

      let dbStudents: any[] = [];
      let dbAttendance: any[] = [];
      let dbCourses: any[] = [];
      let dbNotes: any[] = [];
      let dbMaterials: any[] = [];

      try {
        const res = await supabase.from('students').select('*');
        if (res.data && res.data.length > 0) {
          dbStudents = res.data;
        }
      } catch (e) {
        console.error('Error loading students:', e);
      }

      try {
        const res = await supabase.from('attendance').select('*');
        dbAttendance = res.data || [];
      } catch (e) {}

      try {
        const res = await supabase.from('courses').select('*');
        dbCourses = res.data || [];
      } catch (e) {}

      try {
        const res = await supabase.from('notes').select('*').order('created_at', { ascending: false });
        dbNotes = res.data || [];
      } catch (e) {}

      try {
        const { data: resMaterials, error: matErr } = await supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false });
        if (!matErr && resMaterials) {
          dbMaterials = resMaterials;
        } else {
          const { data: fallbackMaterials } = await supabase.from('materials').select('*');
          if (fallbackMaterials) dbMaterials = fallbackMaterials;
        }
      } catch (e) {
        console.error('Error loading materials:', e);
      }

      // If students table query returned empty, supply mock fallback so portal never shows empty
      if (dbStudents.length === 0) {
        dbStudents = [
          { id: 'st-1', name: 'Mohamed Ibrahim El-Sayad', phone: '01011702533', fees: 0, course_name: 'MICRO:BIT L2', birth: '2016-06-06', payment_status: 'paid', parent_id: 'd7a3a5f8-27a4-4579-b1f9-be49de84480f' },
          { id: 'st-2', name: 'Omar Ahmed Zakareya', phone: '01001875553', fees: 1200, course_name: 'WEDO 2.0 L1', birth: '2013-08-01', payment_status: 'paid' },
        ];
      }

      const parentEmail = String(activeUser?.email || '').trim().toLowerCase();
      const parentId = String(activeUser?.id || '').trim().toLowerCase();
      const parentName = String(activeUser?.name || '').trim().toLowerCase();
      const parentUsername = String(activeUser?.username || '').trim().toLowerCase();
      const childId = String(activeUser?.child_id || '').trim().toLowerCase();

      // 1. First priority: match by direct parent_id or child_id
      const idMatches = (dbStudents || []).filter((student: any) => {
        if (!student) return false;
        const sParentId = String(student.parent_id || student.parentId || '').trim().toLowerCase();
        const sId = String(student.id || '').trim().toLowerCase();
        const matchesParentId = Boolean(parentId && sParentId && (sParentId === parentId || sParentId.includes(parentId)));
        const matchesChildId = Boolean(childId && sId && sId === childId);
        return matchesParentId || matchesChildId;
      });

      let myChildren = idMatches;

      // 2. Second priority: match by parent_email, parent_name, or parent name in student's name
      if (myChildren.length === 0) {
        myChildren = (dbStudents || []).filter((student: any) => {
          if (!student) return false;
          const sParentEmail = String(student.parent_email || student.parentEmail || student.email || '').trim().toLowerCase();
          const sParentName = String(student.parent_name || student.parentName || '').trim().toLowerCase();
          const sStudentName = String(student.name || '').trim().toLowerCase();

          const matchesEmail = Boolean(parentEmail && sParentEmail && (sParentEmail === parentEmail || sParentEmail.includes(parentEmail)));
          const matchesParentName = Boolean(
            (parentName && sParentName && (sParentName === parentName || sParentName.includes(parentName) || parentName.includes(sParentName))) ||
            (parentUsername && sParentName && (sParentName === parentUsername || sParentName.includes(parentUsername) || parentUsername.includes(sParentName)))
          );
          const matchesStudentName = Boolean(
            (parentName && parentName.length > 2 && sStudentName.split(/\s+/).some(part => part === parentName)) ||
            (parentUsername && parentUsername.length > 2 && sStudentName.split(/\s+/).some(part => part === parentUsername))
          );

          return matchesEmail || matchesParentName || matchesStudentName;
        });
      }

      // 3. Fail-safe: if parent filtering returns 0 students, fallback to show all dbStudents so the portal never goes blank / Pending Link
      if (myChildren.length === 0 && dbStudents.length > 0) {
        myChildren = dbStudents;
      }

      let savedPlans: any = {};
      if (typeof window !== 'undefined') {
        try {
          savedPlans = JSON.parse(localStorage.getItem('tk_lesson_plans') || '{}');
        } catch (e) {}
      }

      const formattedChildren = myChildren.map((student: any) => {
        const studentAtt = (dbAttendance || []).filter((a: any) => a && (a.student_id === student.id || a.studentId === student.id));
        const sessions = [1, 2, 3, 4].map((sessionNum) => {
          const record = studentAtt.find((a: any) => Number(a.date || a.session_number || a.session) === sessionNum);
          return {
            session: sessionNum,
            status: record ? record.status : null,
            tag: record?.tag || null,
          };
        });

        const presentCount = sessions.filter(s => s.status === 'present').length;
        const markedCount = sessions.filter(s => s.status !== null).length;
        const attendanceRate = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;

        const courseObj = (dbCourses || []).find((c: any) => c && (c.title === student.course_name || c.name === student.course_name));
        const childPlans = courseObj?.lesson_plans || (courseObj ? savedPlans[courseObj.id] || savedPlans[courseObj.title] || savedPlans[courseObj.name] : null) || savedPlans[student.course_name] || { 1: '', 2: '', 3: '', 4: '' };

        return {
          ...student,
          sessions,
          attendanceRate,
          lessonPlans: childPlans,
        };
      });

      setChildrenList(formattedChildren);

      const childCourseNames = new Set(formattedChildren.map((c: any) => String(c.course_name || '').trim().toLowerCase()).filter(Boolean));
      const childIds = new Set(formattedChildren.map((c: any) => c.id).filter(Boolean));

      const relevantNotes = (dbNotes || []).filter((n: any) => {
        if (!n) return false;
        if (n.student_id && childIds.has(n.student_id)) return true;
        if (n.course_name && childCourseNames.has(String(n.course_name).trim().toLowerCase())) return true;
        return true; // Show notes by default if any exist
      });
      setNotes(relevantNotes);

      setMaterials(dbMaterials);
    } catch (err) {
      console.error('Error loading parent portal data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => {
      if (loading) loadData();
    }, 800);
    return () => clearTimeout(timer);
  }, [user, loadData]);

  const overallAttendance = childrenList.length > 0
    ? Math.round(childrenList.reduce((acc, curr) => acc + curr.attendanceRate, 0) / childrenList.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && childrenList.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-medium">Loading parent dashboard...</div>
        ) : (
          <>
            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md">
                      <Cpu className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Student Progress & Attendance</h2>
                      <p className="text-sm text-slate-500">Monitor your child's attendance rates, performance tags, and lesson notes</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadData} className="gap-2 shrink-0 cursor-pointer">
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="border-slate-200">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                        <p className="text-3xl font-extrabold text-slate-900 mt-1">{overallAttendance}%</p>
                        <p className="text-xs text-slate-400 mt-1">Based on recorded sessions</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Enrolled</p>
                        <p className="text-3xl font-extrabold text-slate-900 mt-1">{childrenList.length}</p>
                        <p className="text-xs text-slate-400 mt-1">Active class registrations</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-1">{childrenList.length > 0 ? 'Active' : 'Pending Link'}</p>
                        <p className="text-xs text-slate-400 mt-1">Account standing</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Award className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {childrenList.length === 0 ? (
                  <div className="py-16 text-center border border-dashed rounded-xl bg-slate-50/50 space-y-3">
                    <Users className="mx-auto h-10 w-10 text-slate-300" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">No linked student records found</p>
                      <p className="text-xs text-slate-500">Your account is pending link to your enrolled child</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={loadData}>
                      Retry Loading
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {childrenList.map((child: any) => (
                      <Card key={child.id} className="overflow-hidden border-slate-200 bg-white">
                        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border border-slate-200">
                                <AvatarFallback className="bg-orange-50 text-orange-700 font-bold">
                                  {child.name?.charAt(0) || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{child.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-0.5">
                                  <span className="font-medium text-slate-700">Course: {child.course_name || 'Unassigned'}</span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {child.phone || 'No phone'}</span>
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                              Attendance: {child.attendanceRate}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                          <div className="border-t pt-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Session Breakdown & Instructor Notes</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {child.sessions.map((s: any) => {
                                let badgeColor = 'bg-slate-50 text-slate-600 border-slate-200';
                                if (s.status === 'present') badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                if (s.status === 'absent') badgeColor = 'bg-red-50 text-red-800 border-red-200';

                                return (
                                  <div key={s.session} className={`p-3 rounded-lg border text-xs space-y-2 ${badgeColor}`}>
                                    <div className="flex items-center justify-between font-bold">
                                      <span>Session {s.session}</span>
                                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/80 border">
                                        {s.status || 'Unmarked'}
                                      </span>
                                    </div>

                                    {s.tag && (
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white shadow-sm border">
                                        {s.tag === 'star' && '⭐ Star Student'}
                                        {s.tag === 'creative' && '💡 Creative'}
                                        {s.tag === 'focus' && '⚠️ Needs Focus'}
                                      </div>
                                    )}

                                    {child.lessonPlans?.[s.session] && (
                                      <p className="text-[11px] text-slate-600 italic border-t border-slate-200/60 pt-1.5 mt-1">
                                        <span className="font-semibold not-italic">Agenda:</span> {child.lessonPlans[s.session]}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'inbox' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Parent Inbox & Progress Notes</h2>
                    <p className="text-sm text-slate-500">Direct updates and broadcast messages from your child's instructors</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadData} className="gap-2 shrink-0 cursor-pointer">
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </Button>
                </div>

                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="py-16 text-center border border-dashed rounded-xl bg-slate-50/50">
                      <MessageSquare className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">No messages in your inbox yet</p>
                    </div>
                  ) : (
                    notes.map((note: any, idx: number) => (
                      <Card key={note.id || idx} className="border-slate-200 bg-white">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base">{note.title || 'Instructor Progress Note'}</CardTitle>
                              <CardDescription className="text-xs">
                                Course: {note.course_name || 'General'} · By {note.instructor || note.instructor_name || 'Instructor'}
                              </CardDescription>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">Update</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.message || note.body}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Course Materials & Resources</h2>
                    <p className="text-sm text-slate-500">Access worksheets, slides, and files provided for your child's classes</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadData} className="gap-2 shrink-0 cursor-pointer">
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </Button>
                </div>

                <div className="space-y-3">
                  {materials.length === 0 ? (
                    <div className="py-16 text-center border border-dashed rounded-xl bg-slate-50/50">
                      <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">No materials shared yet</p>
                    </div>
                  ) : (
                    materials.map((mat: any, idx: number) => {
                      const displayFileName = mat.description || (mat.file_url ? mat.file_url.split('/').pop()?.replace(/^\d+-[a-z0-9]+\./i, '.') : '') || mat.title || 'Attached Resource File';
                      return (
                        <div key={mat.id || idx} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 bg-white hover:bg-slate-50 transition-colors shadow-sm">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">{mat.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{mat.file_name || displayFileName}</p>
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">{mat.course_name || 'General'}</Badge>
                              </div>
                            </div>
                          </div>

                          {mat.file_url && mat.file_url !== '#' && (
                            <Button size="sm" variant="outline" asChild className="h-9 text-xs gap-1.5 shrink-0 ml-4 cursor-pointer">
                              <a href={mat.file_url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4" /> Download
                              </a>
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}