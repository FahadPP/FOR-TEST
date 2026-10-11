import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Course, Assignment, Lecture, UserProfile } from '../types';

export interface CloudDataPayload {
  courses: Course[];
  assignments: Assignment[];
  lectures: Lecture[];
  profile?: UserProfile;
}

// Helper to serialize course metadata (studyMaterial, resources, extra notes) into the existing 'notes' text column
function serializeCourseNotes(course: Course): string {
  try {
    const meta: Record<string, any> = {};
    if (course.studyMaterial) meta.studyMaterial = course.studyMaterial;
    if (course.resources && course.resources.length > 0) meta.resources = course.resources;
    return JSON.stringify(meta);
  } catch {
    return '';
  }
}

// Helper to deserialize course metadata from 'notes' text column
function deserializeCourseNotes(notesStr?: string | null): {
  studyMaterial?: Course['studyMaterial'];
  resources?: Course['resources'];
} {
  if (!notesStr || !notesStr.trim()) return {};
  try {
    const parsed = JSON.parse(notesStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        studyMaterial: parsed.studyMaterial,
        resources: parsed.resources,
      };
    }
  } catch {
    // If it was plain text notes from an earlier version
  }
  return {};
}

/**
 * Syncs local academic data to Supabase for the authenticated user
 */
export async function syncLocalDataToCloud(
  userId: string, 
  data: CloudDataPayload
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured yet' };
  }

  try {
    // 1. Sync Courses (including studyMaterial and resources via notes payload)
    if (data.courses && data.courses.length > 0) {
      const coursesPayload = data.courses.map((course) => ({
        id: course.id,
        user_id: userId,
        name: course.name,
        code: course.code,
        instructor: course.instructor,
        color: course.color,
        schedule: course.schedule || [],
        notes: serializeCourseNotes(course),
        grade_breakdown: course.grades || {},
      }));

      const { error: coursesErr } = await supabase
        .from('courses')
        .upsert(coursesPayload, { onConflict: 'id' });

      if (coursesErr) console.error('Error syncing courses:', coursesErr);
    }

    // 2. Sync Assignments
    if (data.assignments && data.assignments.length > 0) {
      const assignmentsPayload = data.assignments.map((assignment) => ({
        id: assignment.id,
        user_id: userId,
        course_id: assignment.courseId,
        title: assignment.title,
        type: assignment.type || 'assignment',
        due_date: assignment.dueDate,
        priority: assignment.priority,
        completed: assignment.status === 'submitted',
        description: assignment.description || '',
        subtasks: assignment.subtasks || [],
      }));

      const { error: assignErr } = await supabase
        .from('assignments')
        .upsert(assignmentsPayload, { onConflict: 'id' });

      if (assignErr) console.error('Error syncing assignments:', assignErr);
    }

    // 3. Sync Lectures
    if (data.lectures && data.lectures.length > 0) {
      const lecturesPayload = data.lectures.map((lec) => ({
        id: lec.id,
        user_id: userId,
        course_id: lec.courseId,
        title: lec.title,
        date: lec.date,
        attended: lec.status === 'attended',
        summary: lec.summary || '',
      }));

      const { error: lecErr } = await supabase
        .from('lectures')
        .upsert(lecturesPayload, { onConflict: 'id' });

      if (lecErr) console.error('Error syncing lectures:', lecErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error during data sync:', err);
    return { success: false, error: err?.message || 'Failed to sync data' };
  }
}

/**
 * Loads academic data from Supabase for the authenticated user
 */
export async function loadCloudData(
  userId: string
): Promise<{ data?: CloudDataPayload; error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not configured yet' };
  }

  try {
    const [coursesRes, assignRes, lecRes] = await Promise.all([
      supabase.from('courses').select('*').eq('user_id', userId),
      supabase.from('assignments').select('*').eq('user_id', userId),
      supabase.from('lectures').select('*').eq('user_id', userId),
    ]);

    const courses: Course[] = (coursesRes.data || []).map((row: any) => {
      const extraMeta = deserializeCourseNotes(row.notes);
      return {
        id: row.id,
        name: row.name,
        code: row.code || '',
        instructor: row.instructor || '',
        color: row.color || 'indigo',
        schedule: row.schedule || [],
        grades: row.grade_breakdown || undefined,
        studyMaterial: extraMeta.studyMaterial,
        resources: extraMeta.resources,
      };
    });

    const assignments: Assignment[] = (assignRes.data || []).map((row: any) => ({
      id: row.id,
      courseId: row.course_id,
      title: row.title,
      type: row.type || 'assignment',
      dueDate: row.due_date || new Date().toISOString().split('T')[0],
      priority: row.priority || 'medium',
      status: row.completed ? 'submitted' : 'pending',
      description: row.description || '',
      subtasks: row.subtasks || [],
    }));

    const lectures: Lecture[] = (lecRes.data || []).map((row: any) => ({
      id: row.id,
      courseId: row.course_id,
      title: row.title,
      date: row.date || new Date().toISOString().split('T')[0],
      time: '10:00',
      status: row.attended ? 'attended' : 'missed',
      notes: '',
      summary: row.summary || '',
    }));

    return {
      data: {
        courses,
        assignments,
        lectures,
      },
    };
  } catch (err: any) {
    console.error('Error fetching cloud data:', err);
    return { error: err?.message || 'Failed to load cloud data' };
  }
}

/**
 * Save single course directly to Supabase
 */
export async function saveCourseToCloud(userId: string, course: Course): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const payload = {
      id: course.id,
      user_id: userId,
      name: course.name,
      code: course.code,
      instructor: course.instructor,
      color: course.color,
      schedule: course.schedule || [],
      notes: serializeCourseNotes(course),
      grade_breakdown: course.grades || {},
    };
    const { error } = await supabase.from('courses').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Failed to save course to Supabase:', error);
    } else {
      console.log('Course successfully saved to Supabase:', course.id);
    }
  } catch (e) {
    console.error('Error in saveCourseToCloud:', e);
  }
}

/**
 * Delete course from Supabase
 */
export async function deleteCourseFromCloud(userId: string, courseId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const { error } = await supabase.from('courses').delete().match({ id: courseId, user_id: userId });
    if (error) console.error('Failed to delete course from Supabase:', error);
  } catch (e) {
    console.error('Error in deleteCourseFromCloud:', e);
  }
}

/**
 * Save single assignment directly to Supabase
 */
export async function saveAssignmentToCloud(userId: string, assignment: Assignment): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const payload = {
      id: assignment.id,
      user_id: userId,
      course_id: assignment.courseId,
      title: assignment.title,
      type: assignment.type || 'assignment',
      due_date: assignment.dueDate,
      priority: assignment.priority,
      completed: assignment.status === 'submitted',
      description: assignment.description || '',
      subtasks: assignment.subtasks || [],
    };
    const { error } = await supabase.from('assignments').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Failed to save assignment to Supabase:', error);
    } else {
      console.log('Assignment successfully saved to Supabase:', assignment.id);
    }
  } catch (e) {
    console.error('Error in saveAssignmentToCloud:', e);
  }
}

/**
 * Delete assignment from Supabase
 */
export async function deleteAssignmentFromCloud(userId: string, assignmentId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const { error } = await supabase.from('assignments').delete().match({ id: assignmentId, user_id: userId });
    if (error) console.error('Failed to delete assignment from Supabase:', error);
  } catch (e) {
    console.error('Error in deleteAssignmentFromCloud:', e);
  }
}

/**
 * Save single lecture directly to Supabase
 */
export async function saveLectureToCloud(userId: string, lecture: Lecture): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const payload = {
      id: lecture.id,
      user_id: userId,
      course_id: lecture.courseId,
      title: lecture.title,
      date: lecture.date,
      attended: lecture.status === 'attended',
      summary: lecture.summary || '',
    };
    const { error } = await supabase.from('lectures').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Failed to save lecture to Supabase:', error);
    } else {
      console.log('Lecture successfully saved to Supabase:', lecture.id);
    }
  } catch (e) {
    console.error('Error in saveLectureToCloud:', e);
  }
}

/**
 * Delete lecture from Supabase
 */
export async function deleteLectureFromCloud(userId: string, lectureId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const { error } = await supabase.from('lectures').delete().match({ id: lectureId, user_id: userId });
    if (error) console.error('Failed to delete lecture from Supabase:', error);
  } catch (e) {
    console.error('Error in deleteLectureFromCloud:', e);
  }
}
