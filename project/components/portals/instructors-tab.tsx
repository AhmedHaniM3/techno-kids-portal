'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, BookOpen, GraduationCap, Mail, Phone } from 'lucide-react';
import rawCourseData from '@/lib/course-data.json';

const courseData = rawCourseData as any;

export default function InstructorsTab() {
  const [search, setSearch] = useState('');

  // Extract unique instructors or instructor list from your course-data.json structure
  const instructorMap: Record<string, { name: string; email: string; phone: string; courses: string[] }> = {};

  (courseData.courses || []).forEach((course: any) => {
    const instructorName = course.instructor || 'Unassigned Instructor';
    if (!instructorMap[instructorName]) {
      instructorMap[instructorName] = {
        name: instructorName,
        email: `${instructorName.toLowerCase().replace(/\s+/g, '')}@technokids.edu`,
        phone: 'Not recorded',
        courses: [],
      };
    }
    instructorMap[instructorName].courses.push(course.courseName);
  });

  const instructors = Object.values(instructorMap);

  const filtered = instructors.filter((i) => {
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Instructors</h2>
            <p className="text-sm text-slate-500">{filtered.length} teaching staff</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((instr, idx) => (
          <Card key={idx} className="border-slate-200 transition-all hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border-2 border-slate-100">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 font-semibold text-slate-700">
                    {instr.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{instr.name}</h3>
                  <p className="text-sm text-slate-500 truncate">{instr.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {instr.courses.length} courses
                </Badge>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Teaching: </span>
                {instr.courses.join(', ')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-400">No instructors found matching your search.</p>
        </div>
      )}
    </div>
  );
}