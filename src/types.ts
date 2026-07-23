export interface PortfolioItem {
  id: string;
  url: string;
  title: string;
  category: 'Weddings' | 'Pre-Weddings' | 'Portraits' | 'Events' | 'Drone' | 'Commercial' | 'AI Creations';
  description: string;
}

export interface ServiceItem {
  title: string;
  description: string;
  category: 'Photography' | 'Cinematography' | 'Editing' | 'AI & Luxury';
  details?: string[];
}

export interface AwardItem {
  title: string;
  authority: string;
  subtitle: string;
  description: string;
}

export interface ProofImage {
  id: string;
  url: string;
  title: string;
  selected: boolean;
  comment: string;
  format?: string;
}

export interface ProofVideo {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  description?: string;
  format?: string;
}

export interface ProofProject {
  id: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  passcode: string;
  date: string;
  category: string;
  description: string;
  images: ProofImage[];
  videos?: ProofVideo[];
  status: 'reviewing' | 'submitted' | 'completed';
  submittedAt?: string;
  selectionNotes?: string;
}

export interface UserSession {
  isLoggedIn: boolean;
  role: 'admin' | 'client';
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  assignedProjectId?: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  rating: number;
}

export interface InquiryItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  submittedAt: string;
  status: 'new' | 'contacted' | 'confirmed' | 'closed';
}

export interface PersonalInfoHighlight {
  label: string;
  value: string;
}

export interface PersonalInfoData {
  name: string;
  title: string;
  tagline: string;
  phone: string;
  email: string;
  instagram: string;
  googleMaps: string;
  aboutLong: string;
  location: string;
  aboutImage?: string;
  highlights: PersonalInfoHighlight[];
}


