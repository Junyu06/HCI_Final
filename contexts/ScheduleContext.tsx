import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Course {
  crn: string;
  subject: string;
  course: string;
  section: string;
  title: string;
  days?: string;
  time?: string;
  schedule?: Array<{ days: string; time: string }>;
  instructor: string;
  credits: number;
}

interface ScheduledCourse extends Course {
  color: string;
}

interface ScheduleContextType {
  scheduledCourses: ScheduledCourse[];
  addCourse: (course: Course) => void;
  removeCourse: (crn: string) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const courseColors = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#06B6D4', '#6366F1', '#EF4444', '#14B8A6', '#F97316',
];

const getRandomColor = () => {
  return courseColors[Math.floor(Math.random() * courseColors.length)];
};

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);

  const addCourse = (course: Course) => {
    const color = getRandomColor();
    const scheduledCourse: ScheduledCourse = { ...course, color };
    setScheduledCourses((prev) => [...prev, scheduledCourse]);
  };

  const removeCourse = (crn: string) => {
    setScheduledCourses((prev) => prev.filter((c) => c.crn !== crn));
  };

  return (
    <ScheduleContext.Provider value={{ scheduledCourses, addCourse, removeCourse }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}
