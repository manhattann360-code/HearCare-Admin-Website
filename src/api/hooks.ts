import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Audiologist, Clinic, Region, Service, Topic } from './types';

/** Small catalog lists used by many forms (everything in one page). */
const BIG = { limit: 200 };

export const useRegions = () =>
  useQuery({ queryKey: ['regions'], queryFn: async () => (await api.list<Region>('/admin/regions', BIG)).data });
export const useServices = () =>
  useQuery({ queryKey: ['services'], queryFn: async () => (await api.list<Service>('/admin/services', BIG)).data });
export const useTopics = () =>
  useQuery({ queryKey: ['topics'], queryFn: async () => (await api.list<Topic>('/admin/topics', BIG)).data });
export const useClinics = () =>
  useQuery({ queryKey: ['clinics'], queryFn: async () => (await api.list<Clinic>('/admin/clinics', BIG)).data });
export const useAudiologists = () =>
  useQuery({
    queryKey: ['audiologists'],
    queryFn: async () => (await api.list<Audiologist>('/admin/audiologists', BIG)).data,
  });
