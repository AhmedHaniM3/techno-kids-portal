'use client';

import { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '@/components/portal-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import rawCourseData from '@/lib/course-data.json';
import { 
  Phone, Search, Crown, LayoutDashboard, BookOpen, Users, Wallet, GraduationCap, Plus, Pencil, Trash2, CheckCircle2, AlertCircle, Download, MessageSquare 
} from 'lucide-react';

const courseData = rawCourseData as any;

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Student Directory', icon: Users },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'instructors', label: 'Instructors', icon: GraduationCap },
  { id: 'finances', label: 'Finances', icon: Wallet },
];

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [parentsList, setParentsList] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '' });
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [instructorSearch, setInstructorSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Dialog states
  const [isStudentOpen, setIsStudentOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isInstructorOpen, setIsInstructorOpen] = useState(false);
  
  // Edit Instructor State
  const [isEditInstructorOpen, setIsEditInstructorOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

  // Edit Student State
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Form states
  const [newStudent, setNewStudent] = useState({ name: '', phone: '', fees: '', course_name: '', birth: '', parent_id: '', payment_status: 'paid' });
  const [newCourse, setNewCourse] = useState({ name: '', day: '', instructor: 'Unassigned' });
  const [newInstructor, setNewInstructor] = useState({ name: '', username: '', password: '', phone: '' });

  const loadData = useCallback(async () => {
    setLoading(true);

    let { data: dbCourses } = await supabase.from('courses').select('*');
    let { data: dbStudents } = await supabase.from('students').select('*');
    const { data: dbUsers } = await supabase.from('app_users').select('*');

    let validParents: any[] = [];
    if (dbUsers) {
      validParents = dbUsers.filter((u: any) => {
        const role = String(u.role || '').trim().toLowerCase();
        return role === 'parent' || (role !== 'owner' && role !== 'instructor');
      });
      setParentsList(validParents);
    }
    const parentIdsSet = new Set(validParents.map((p: any) => p.id));

    if ((!dbCourses || dbCourses.length === 0) && courseData.courses) {
      for (const course of courseData.courses) {
        await supabase.from('courses').insert({
          title: course.courseName,
          day: course.day || 'Flexible',
          instructor: course.instructor || 'Unassigned'
        });

        if (course.students) {
          for (const student of course.students) {
            await supabase.from('students').insert({
              name: student.name,
              phone: student.phone || 'No phone',
              fees: student.fees || 0,
              course_name: course.courseName,
              birth: '2010-01-01',
              payment_status: 'paid'
            });
          }
        }
      }
      const resCourses = await supabase.from('courses').select('*');
      const resStudents = await supabase.from('students').select('*');
      dbCourses = resCourses.data;
      dbStudents = resStudents.data;
    }

    const coursesMap = (dbCourses || []).map((c: any) => {
      const courseTitle = c.title || c.name;
      const enrolledStudents = (dbStudents || []).filter((s: any) => s.course_name === courseTitle);
      const courseRevenue = enrolledStudents.reduce((sum, s) => sum + (Number(s.fees) || 0), 0);
      return {
        id: c.id,
        name: courseTitle,
        day: c.day || 'Flexible',
        instructor: c.instructor || 'Unassigned',
        studentCount: enrolledStudents.length,
        revenue: courseRevenue,
      };
    });

    const parentsMap = new Map(validParents.map((p: any) => [p.id, p]));

    const mappedStudents = (dbStudents || []).map((s: any) => {
      const parentObj = parentsMap.get(s.parent_id);
      return {
        id: s.id,
        name: s.name || s.full_name || 'Unknown',
        phone: s.phone || s.phone1 || 'No phone',
        fees: Number(s.fees) || 0,
        courseName: s.course_name || 'Unassigned',
        birth: s.birth || s.date_of_birth || '',
        parentId: parentIdsSet.has(s.parent_id) ? s.parent_id : '',
        parentName: parentObj ? (parentObj.name || parentObj.username || 'Parent') : 'Parent',
        paymentStatus: s.payment_status || 'paid',
      };
    });

    const validInstructors = (dbUsers || []).filter((u: any) => u.role === 'instructor');
    const instructorNamesSet = new Set(validInstructors.map(u => u.name));
    
    coursesMap.forEach((c: any) => {
      if (c.instructor && c.instructor !== 'Unassigned' && !instructorNamesSet.has(c.instructor)) {
        validInstructors.push({
          id: `virtual-${c.instructor}`,
          name: c.instructor,
          username: c.instructor.toLowerCase().replace(/\s+/g, ''),
          role: 'instructor',
          phone: 'Not provided'
        });
        instructorNamesSet.add(c.instructor);
      }
    });

    const mappedInstructors = validInstructors.map((u: any) => {
      const assignedCourses = coursesMap
        .filter((c: any) => c.instructor === u.name)
        .map((c: any) => c.name);

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        phone: u.phone || 'Not provided',
        email: `${u.username.toLowerCase().replace(/\s+/g, '')}@technokids.edu`,
        courses: assignedCourses,
      };
    });

    setStudents(mappedStudents);
    setCoursesList(coursesMap);
    setInstructorsList(mappedInstructors);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    try {
      const saved = localStorage.getItem('tk_owner_expenses');
      if (saved) {
        setExpenses(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load expenses from localStorage', e);
    }
  }, [loadData]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const selectedParentObj = parentsList.find(p => p.id == newStudent.parent_id);
      const parentIdVal = selectedParentObj ? selectedParentObj.id : null;

      const payload = {
        name: newStudent.name,
        phone: newStudent.phone || null,
        fees: newStudent.fees ? Number(newStudent.fees) : 0,
        course_name: newStudent.course_name || null,
        birth: newStudent.birth || null,
        parent_id: parentIdVal,
        payment_status: newStudent.payment_status,
      };

      const { error } = await supabase.from('students').insert([payload]);
      if (error) throw error;

      toast({ title: 'Success', description: 'Student added successfully!' });
      setIsStudentOpen(false);
      setNewStudent({ name: '', phone: '', fees: '', course_name: '', birth: '', parent_id: '', payment_status: 'paid' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  async function handleUpdateStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const selectedParentObj = parentsList.find(p => p.id == selectedStudent.parentId);
      const parentIdVal = selectedParentObj ? selectedParentObj.id : null;

      const payload = {
        name: selectedStudent.name,
        phone: selectedStudent.phone || null,
        fees: selectedStudent.fees ? Number(selectedStudent.fees) : 0,
        course_name: selectedStudent.courseName || null,
        birth: selectedStudent.birth || null,
        parent_id: parentIdVal,
        payment_status: selectedStudent.paymentStatus,
      };

      const { error } = await supabase
        .from('students')
        .update(payload)
        .eq('id', selectedStudent.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Student updated successfully!' });
      setIsEditStudentOpen(false);
      setSelectedStudent(null);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  async function handleTogglePaymentStatus(studentId: string, currentStatus: string) {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const { error } = await supabase.from('students').update({ payment_status: newStatus }).eq('id', studentId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Payment status marked as ${newStatus}.` });
      loadData();
    }
  }

  async function handleDeleteStudent(studentId: string) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Student deleted successfully.' });
      loadData();
    }
  }

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('courses').insert([{
      title: newCourse.name,
      day: newCourse.day,
      instructor: newCourse.instructor
    }]);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Course added successfully!' });
      setIsCourseOpen(false);
      setNewCourse({ name: '', day: '', instructor: 'Unassigned' });
      loadData();
    }
  }

  async function handleAddInstructor(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('app_users').insert([{
      name: newInstructor.name,
      username: newInstructor.username,
      password: newInstructor.password,
      role: 'instructor'
    }]);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Instructor account created!' });
      setIsInstructorOpen(false);
      setNewInstructor({ name: '', username: '', password: '', phone: '' });
      loadData();
    }
  }

  async function handleUpdateInstructor(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInstructor) return;

    if (!String(selectedInstructor.id).startsWith('virtual-')) {
      await supabase.from('app_users').update({
        name: selectedInstructor.name,
      }).eq('id', selectedInstructor.id);
    }

    for (const course of coursesList) {
      const isAssignedNow = selectedInstructor.courses.includes(course.name);
      const wasAssignedBefore = course.instructor === selectedInstructor.name;

      if (isAssignedNow && !wasAssignedBefore) {
        if (course.id) {
          await supabase.from('courses').update({ instructor: selectedInstructor.name }).eq('id', course.id);
        }
        await supabase.from('courses').update({ instructor: selectedInstructor.name }).eq('title', course.name);
      } else if (!isAssignedNow && wasAssignedBefore) {
        if (course.id) {
          await supabase.from('courses').update({ instructor: 'Unassigned' }).eq('id', course.id);
        }
        await supabase.from('courses').update({ instructor: 'Unassigned' }).eq('title', course.name);
      }
    }

    toast({ title: 'Success', description: 'Instructor updated!' });
    setIsEditInstructorOpen(false);
    loadData();
  }

  async function handleDeleteInstructor(instructorId: string) {
    if (!confirm('Are you sure you want to remove this instructor profile?')) return;
    if (String(instructorId).startsWith('virtual-')) {
      toast({ title: 'Notice', description: 'Please create an account in app_users to manage deletion.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('app_users').delete().eq('id', instructorId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Instructor removed.' });
      loadData();
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount) return;
    const expenseItem = {
      id: Date.now(),
      title: newExpense.title.trim(),
      amount: Number(newExpense.amount)
    };
    const updated = [...expenses, expenseItem];
    setExpenses(updated);
    try {
      localStorage.setItem('tk_owner_expenses', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save expenses to localStorage', err);
    }
    setNewExpense({ title: '', amount: '' });
    setIsExpenseOpen(false);
    toast({ title: 'Success', description: 'Expense added successfully.' });
  }

  async function handleDeleteExpense(expenseId: number) {
    const updated = expenses.filter(ex => ex.id !== expenseId);
    setExpenses(updated);
    try {
      localStorage.setItem('tk_owner_expenses', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update expenses in localStorage', err);
    }
    toast({ title: 'Success', description: 'Expense removed.' });
  }

  function exportFinancialCSV() {
    const headers = ['Student Name', 'Course', 'Phone', 'Fees (EGP)', 'Payment Status'];
    const rows = students.map(s => [
      `"${s.name}"`,
      `"${s.courseName}"`,
      `"${s.phone}"`,
      s.fees,
      s.paymentStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TechnoKids_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Export Successful', description: 'Financial CSV downloaded for accounting.' });
  }

  function sendPaymentReminder(student: any) {
    const parentName = student.parentName || 'Parent';
    const message = encodeURIComponent(
      `Hello Mr/Mrs ${parentName}\n\nJust a reminder to renew your TechnoKids KafrAbdo subscription for ${student.name} as the current subscription ends!\nPlease note to pay ${student.fees} EGP due to next session\nThanks in advance.`
    );
    const phoneClean = student.phone ? student.phone.replace(/\D/g, '') : '';
    const whatsappUrl = `https://wa.me/${phoneClean.startsWith('2') ? phoneClean : '2' + phoneClean}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const name = (s.name || '').toLowerCase();
    const courseName = (s.courseName || '').toLowerCase();
    return name.includes(q) || courseName.includes(q);
  });

  const filteredInstructors = instructorsList.filter((i) => {
    const q = instructorSearch.toLowerCase();
    return (i.name || '').toLowerCase().includes(q);
  });

  const totalRevenue = students.reduce((sum, s) => sum + (Number(s.fees) || 0), 0);
  const paidCount = students.filter(s => s.paymentStatus === 'paid').length;
  const pendingCount = students.filter(s => s.paymentStatus === 'pending').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <PortalLayout
      role="owner"
      roleLabel="Owner"
      roleIcon={Crown}
      roleGradient="from-blue-600 to-cyan-500"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="TechnoKids Logo" 
                className="h-10 w-10 object-contain rounded-lg shadow-sm border bg-white p-1" 
              />
              <h2 className="text-2xl font-bold tracking-tight">Overview Dashboard</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground">Total Students</div>
              <div className="text-3xl font-bold mt-2">{students.length}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground">Total Courses</div>
              <div className="text-3xl font-bold mt-2">{coursesList.length}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground">Total Expected Fees</div>
              <div className="text-3xl font-bold mt-2 text-emerald-600">{totalRevenue.toLocaleString()} EGP</div>
            </Card>
          </div>
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Student Directory ({students.length})</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Dialog open={isStudentOpen} onOpenChange={setIsStudentOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5"><Plus className="h-4 w-4" /> Add Student</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} placeholder="e.g. Omar Ahmed" />
                    </div>
                    <div>
                      <Label>Birth Date</Label>
                      <Input type="date" value={newStudent.birth} onChange={e => setNewStudent({...newStudent, birth: e.target.value})} />
                    </div>
                    <div>
                      <Label>Parent Profile</Label>
                      <select
                        value={newStudent.parent_id}
                        onChange={e => setNewStudent({...newStudent, parent_id: e.target.value})}
                        className="mt-1 w-full border rounded-lg p-2 bg-white text-sm"
                      >
                        <option value="">No Parent Assigned</option>
                        {parentsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.username || 'Unnamed Parent'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} placeholder="e.g. 01012345678" />
                    </div>
                    <div>
                      <Label>Course</Label>
                      <select
                        value={newStudent.course_name}
                        onChange={e => setNewStudent({...newStudent, course_name: e.target.value})}
                        className="mt-1 w-full border rounded-lg p-2 bg-white text-sm"
                      >
                        <option value="">Select Course...</option>
                        {coursesList.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Fees (EGP)</Label>
                      <Input type="number" value={newStudent.fees} onChange={e => setNewStudent({...newStudent, fees: e.target.value})} placeholder="e.g. 1500" />
                    </div>
                    <div>
                      <Label>Payment Status</Label>
                      <select
                        value={newStudent.payment_status}
                        onChange={e => setNewStudent({...newStudent, payment_status: e.target.value})}
                        className="mt-1 w-full border rounded-lg p-2 bg-white text-sm"
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Student</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="p-4 space-y-2 shadow-sm relative">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-lg">{student.name}</div>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-slate-500 hover:text-blue-600"
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsEditStudentOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-slate-500 hover:text-destructive"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {student.phone}
                </div>
                {student.birth && <div className="text-xs text-muted-foreground">Birth: {student.birth}</div>}
                
                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <Badge variant="secondary">{student.courseName}</Badge>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePaymentStatus(student.id, student.paymentStatus)}
                      title="Click to toggle status"
                      className="cursor-pointer"
                    >
                      {student.paymentStatus === 'paid' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 gap-1">
                          <AlertCircle className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </button>
                    <span className="text-sm font-bold text-emerald-600">{student.fees} EGP</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Edit Student Dialog */}
          <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
              {selectedStudent && (
                <form onSubmit={handleUpdateStudent} className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input required value={selectedStudent.name} onChange={e => setSelectedStudent({...selectedStudent, name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Birth Date</Label>
                    <Input type="date" value={selectedStudent.birth || ''} onChange={e => setSelectedStudent({...selectedStudent, birth: e.target.value})} />
                  </div>
                  <div>
                    <Label>Parent Profile</Label>
                    <select
                      value={selectedStudent.parentId || ''}
                      onChange={e => setSelectedStudent({...selectedStudent, parentId: e.target.value})}
                      className="mt-1 w-full border rounded-lg p-2 bg-white text-sm"
                    >
                      <option value="">No Parent Assigned</option>
                      {parentsList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name || p.username || 'Unnamed Parent'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={selectedStudent.phone} onChange={e => setSelectedStudent({...selectedStudent, phone: e.target.value})} />
                  </div>
                  <div>
                    <Label>Course</Label>
                    <select
                      value={selectedStudent.courseName}
                      onChange={e => setSelectedStudent({...selectedStudent, courseName: e.target.value})}
                      className="mt-1 w-full border rounded-lg p-2 bg-white text-sm"
                    >
                      <option value="">Select Course...</option>
                      {coursesList.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Fees (EGP)</Label>
                    <Input type="number" value={selectedStudent.fees} onChange={e => setSelectedStudent({...selectedStudent, fees: e.target.value})} />
                  </div>
                  <div>
                    <Label>Payment Status</Label>
                    <select
                      value={selectedStudent.paymentStatus}
                      onChange={e => setSelectedStudent({...selectedStudent, paymentStatus: e.target.value})}
                      className="mt-1 w-full border rounded-lg p-2 bg-white text-sm"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Update Student</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* COURSES TAB */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Courses Management ({coursesList.length})</h2>
            <Dialog open={isCourseOpen} onOpenChange={setIsCourseOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5"><Plus className="h-4 w-4" /> Add Course</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Course</DialogTitle></DialogHeader>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div>
                    <Label>Course Name</Label>
                    <Input required value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} placeholder="e.g. Robotics Level 1" />
                  </div>
                  <div>
                    <Label>Schedule / Day</Label>
                    <Input value={newCourse.day} onChange={e => setNewCourse({...newCourse, day: e.target.value})} placeholder="e.g. Saturdays 4:00 PM" />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Course</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesList.map((course) => (
              <Card key={course.id} className="p-4 space-y-2 shadow-sm">
                <div className="font-semibold text-lg">{course.name}</div>
                <div className="text-sm text-muted-foreground">Schedule: {course.day || 'Flexible'}</div>
                <div className="text-sm text-slate-600">Instructor: <span className="font-medium">{course.instructor}</span></div>
                <div className="pt-2 flex justify-between items-center">
                  <Badge variant="outline">{course.studentCount} Students Enrolled</Badge>
                  <span className="text-xs font-semibold text-emerald-600">{course.revenue} EGP Rev</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* INSTRUCTORS TAB */}
      {activeTab === 'instructors' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Instructors Directory</h2>
                <p className="text-sm text-slate-500">{filteredInstructors.length} teaching staff</p>
              </div>
              <Dialog open={isInstructorOpen} onOpenChange={setIsInstructorOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5"><Plus className="h-4 w-4" /> Add Instructor</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Instructor</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddInstructor} className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input required value={newInstructor.name} onChange={e => setNewInstructor({...newInstructor, name: e.target.value})} placeholder="e.g. Noha" />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input value={newInstructor.phone} onChange={e => setNewInstructor({...newInstructor, phone: e.target.value})} placeholder="e.g. 01012345678" />
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input required value={newInstructor.username} onChange={e => setNewInstructor({...newInstructor, username: e.target.value})} placeholder="e.g. noha" />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input required type="password" value={newInstructor.password} onChange={e => setNewInstructor({...newInstructor, password: e.target.value})} placeholder="••••••••" />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Account</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">{instructor.name}</div>
                    <div className="text-xs text-muted-foreground">@{instructor.username}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-slate-500 hover:text-blue-600"
                      onClick={() => {
                        setSelectedInstructor(JSON.parse(JSON.stringify(instructor)));
                        setIsEditInstructorOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-slate-500 hover:text-destructive"
                      onClick={() => handleDeleteInstructor(instructor.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {instructor.phone}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500">Assigned Courses:</div>
                  <div className="flex flex-wrap gap-1">
                    {instructor.courses.length > 0 ? (
                      instructor.courses.map((cName: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{cName}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No courses assigned</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Edit Instructor Dialog */}
          <Dialog open={isEditInstructorOpen} onOpenChange={setIsEditInstructorOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Instructor & Course Assignments</DialogTitle></DialogHeader>
              {selectedInstructor && (
                <form onSubmit={handleUpdateInstructor} className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input required value={selectedInstructor.name} onChange={e => setSelectedInstructor({...selectedInstructor, name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={selectedInstructor.phone} onChange={e => setSelectedInstructor({...selectedInstructor, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Courses</Label>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                      {coursesList.map((course) => {
                        const isAssigned = selectedInstructor.courses.includes(course.name);
                        return (
                          <div key={course.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`course-check-${course.id}`}
                              checked={isAssigned}
                              onCheckedChange={(checked) => {
                                let updatedCourses = [...selectedInstructor.courses];
                                if (checked) {
                                  if (!updatedCourses.includes(course.name)) updatedCourses.push(course.name);
                                } else {
                                  updatedCourses = updatedCourses.filter(c => c !== course.name);
                                }
                                setSelectedInstructor({...selectedInstructor, courses: updatedCourses});
                              }}
                            />
                            <label htmlFor={`course-check-${course.id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {course.name} <span className="text-xs text-muted-foreground">({course.day})</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* FINANCES TAB */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Financial Overview</h2>
            <div className="flex gap-2">
              <Button onClick={exportFinancialCSV} variant="outline" className="gap-1.5">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5"><Plus className="h-4 w-4" /> Add Expense</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Expense Item</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                      <Label>Expense Title</Label>
                      <Input required value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} placeholder="e.g. Marketing" />
                    </div>
                    <div>
                      <Label>Amount (EGP)</Label>
                      <Input required type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="e.g. 500" />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Expense</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
              <div className="text-3xl font-bold mt-2 text-emerald-600">{totalRevenue.toLocaleString()} EGP</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
              <div className="text-3xl font-bold mt-2 text-rose-600">{totalExpenses.toLocaleString()} EGP</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground">Net Profit</div>
              <div className="text-3xl font-bold mt-2 text-blue-600">{netProfit.toLocaleString()} EGP</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground">Payment Status</div>
              <div className="text-sm mt-2 flex gap-3">
                <span className="text-emerald-600 font-semibold">{paidCount} Paid</span>
                <span className="text-amber-600 font-semibold">{pendingCount} Pending</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-bold">Expenses Breakdown</h3>
              <div className="space-y-2">
                {expenses.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No expenses recorded yet. Use the &quot;Add Expense&quot; button above to track expenditures.
                  </div>
                ) : (
                  expenses.map((ex) => (
                    <div key={ex.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{ex.title}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-rose-600">{ex.amount} EGP</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-destructive cursor-pointer" onClick={() => handleDeleteExpense(ex.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-bold">Pending Payment Reminders</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {students.filter(s => s.paymentStatus === 'pending').length > 0 ? (
                  students.filter(s => s.paymentStatus === 'pending').map((student) => (
                    <div key={student.id} className="flex justify-between items-center p-3 border rounded-lg bg-amber-50/50">
                      <div>
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.courseName} • {student.fees} EGP</div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => sendPaymentReminder(student)}>
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">No pending payments found! All students are paid up.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}