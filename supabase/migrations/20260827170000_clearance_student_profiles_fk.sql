-- Fix: Allow PostgREST to resolve the embedded "profiles" join in the
-- registrar final queue (registrar/queue.tsx uses profiles!inner(...)).
--
-- PostgREST resolves embedded resources via foreign-key relationships.
-- clearance_applications.student_id only referenced auth.users(id), so there
-- was no relationship to profiles -> the embedded profiles!inner() request
-- failed with a PostgREST error, and the queue showed "No students found".
--
-- We add a second FK from student_id -> profiles(id), keeping the existing
-- auth.users FK intact so cascading user deletes are unchanged.

ALTER TABLE public.clearance_applications
  ADD CONSTRAINT clearance_applications_student_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id);
