import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportingFilters({ filters, setFilters, subjects = [], classes = [], teachers = [] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      <div>
        <Label>Date from</Label>
        <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Date to</Label>
        <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Subject</Label>
        <Select value={filters.subjectId} onValueChange={(value) => setFilters({ ...filters, subjectId: value })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Class</Label>
        <Select value={filters.classId} onValueChange={(value) => setFilters({ ...filters, classId: value })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Teacher</Label>
        <Select value={filters.teacherId} onValueChange={(value) => setFilters({ ...filters, teacherId: value })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {teachers.map((item) => <SelectItem key={item.user_id} value={item.user_id}>{item.user_name || item.user_email}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}