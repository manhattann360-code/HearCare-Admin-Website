export type Bilingual = { en: string; sw: string };
export type Id = string;

export interface Admin {
  id: Id;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Stats {
  audiologists: number;
  verifiedAudiologists: number;
  clinics: number;
  articlesPublished: number;
  articlesDraft: number;
  upcomingAppointments: number;
  patients: number;
}

export interface Region {
  id: Id;
  name: string;
  slug?: string;
  sortOrder: number;
  audiologistCount?: number;
}
export interface Service {
  id: Id;
  name: Bilingual;
  description: Bilingual;
  icon: string;
  forChildren: boolean;
  isActive: boolean;
}
export interface Topic {
  id: Id;
  name: Bilingual;
  icon: string;
  sortOrder: number;
  articleCount?: number;
}

export interface OpeningHour {
  label: string;
  hours: string;
}
export interface Clinic {
  id: Id;
  name: string;
  regionId: Id;
  regionName?: string;
  district: string;
  addressLine: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  whatsapp: string;
  acceptsInsurance: string[];
  paymentNote: string;
  openingHours: OpeningHour[];
}

export type Gender = 'female' | 'male' | 'unspecified';
export interface WeeklyHour {
  dayOfWeek: number; // 0 = Sunday
  start: string;
  end: string;
}
export interface TimeOff {
  from: string;
  to: string;
  reason: string;
}
export interface Audiologist {
  id: Id;
  name: string;
  title: string;
  photoUrl: string | null;
  bio: Bilingual;
  clinicId: Id;
  clinicName?: string;
  regionName?: string;
  serviceIds: Id[];
  languages: string[];
  gender: Gender;
  yearsExperience: number;
  registrationNumber: string;
  verified: boolean;
  contactPhone: string;
  slotMinutes: number;
  leadTimeHours: number;
  maxDaysAhead: number;
  weeklyHours: WeeklyHour[];
  timeOff: TimeOff[];
  isActive: boolean;
}

export type ArticleTag = 'care-guide' | 'prevention' | 'devices' | 'children' | 'general';
export interface ArticleListItem {
  id: Id;
  topicId: Id;
  topicName: string;
  status: 'draft' | 'published';
  tag: ArticleTag;
  isFeatured: boolean;
  heroImageUrl: string | null;
  readMinutes: number;
  title: Bilingual;
  hasSwahili: boolean;
  updatedAt: string;
  publishedAt: string | null;
}
export interface ArticleDetail {
  id: Id;
  status: 'draft' | 'published';
  topicId: Id;
  tag: ArticleTag;
  isFeatured: boolean;
  heroImageUrl: string | null;
  reviewedBy: { name: string; credential: string } | null;
  title: Bilingual;
  summary: Bilingual;
  bodyHtml: Bilingual;
}
export interface ArticlePayload {
  topicId: Id;
  tag: ArticleTag;
  isFeatured: boolean;
  heroImageUrl: string | null;
  reviewedBy: { name: string; credential: string } | null;
  title: Bilingual;
  summary: Bilingual;
  bodyHtml: Bilingual;
}
export interface ImportResult {
  title: string;
  html: string;
  warnings: string[];
}

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export interface AdminAppointment {
  id: Id;
  status: AppointmentStatus;
  startAt: string;
  patient: { name: string; phone: string };
  audiologistName: string;
  clinicName: string;
  serviceName: string;
  bookedFor?: { type: 'self' | 'child' | 'other'; name?: string | null; ageYears?: number | null } | null;
  note?: string | null;
}

export interface Patient {
  id: Id;
  name: string;
  phone: string;
  regionName: string | null;
  createdAt: string;
  appointmentCount: number;
}
