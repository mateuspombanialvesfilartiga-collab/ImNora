export type UserRole = 'buyer' | 'seller' | 'owner' | 'admin';

export type VerifiedStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'suspended';

export type PropertyStatus = 'draft' | 'published_open' | 'seller_selected' | 'in_negotiation' | 'sold' | 'paused';

export type ApplicationStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  sellerVerifiedStatus?: VerifiedStatus;
  unreadNotifications?: number;
  profile?: any;
}

export interface PropertyImage {
  id: string;
  image_url: string;
  is_primary: number;
}

export interface Property {
  id: string;
  owner_id: string;
  assigned_seller_id: string | null;
  title: string;
  description: string;
  property_type: string;
  price: number;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  suites: number;
  parking_spots: number;
  area_sqm: number;
  status: PropertyStatus;
  created_at: string;
  primary_image?: string;
  images?: PropertyImage[];
  features?: string[];
  seller_name?: string;
  seller_creci?: string;
  seller_creci_state?: string;
  seller_rating?: number;
  seller_reviews_count?: number;
  seller_sales_count?: number;
  seller_photo?: string;
  seller_bio?: string;
  open_applications_count?: number;
  owner?: {
    id: string;
    name: string;
  };
}

export interface SellerApplication {
  id: string;
  property_id: string;
  seller_id: string;
  commission_percent: number;
  estimatedCommissionValue?: number;
  message?: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  seller_name?: string;
  seller_creci?: string;
  seller_creci_state?: string;
  seller_phone?: string;
  seller_bio?: string;
  seller_photo?: string;
  seller_rating?: number;
  seller_reviews_count?: number;
  seller_sales_count?: number;
  seller_verified_status?: VerifiedStatus;
  property_title?: string;
  property_price?: number;
  property_city?: string;
  property_neighborhood?: string;
  property_status?: PropertyStatus;
  property_image?: string;
}

export interface Conversation {
  id: string;
  property_id: string;
  participant1_id: string;
  participant2_id: string;
  conversation_type: 'buyer_seller' | 'seller_owner';
  last_message_at: string;
  property_title: string;
  property_price: number;
  property_image?: string;
  last_message?: string;
  unread_count: number;
  peer: {
    id: string;
    name: string;
    role: string;
    photo?: string | null;
    creci?: string | null;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  reviewerRole: string;
  reviewerName: string;
  ratingOverall: number;
  ratingService: number;
  ratingCommunication: number;
  ratingProfessionalism: number;
  comment: string | null;
  propertyTitle: string;
  createdAt: string;
}

export interface SellerPublicProfile {
  id: string;
  full_name: string;
  creci_number: string;
  creci_state: string;
  bio?: string;
  photo_url?: string;
  verified_status: VerifiedStatus;
  rating_avg: number;
  reviews_count: number;
  sales_count: number;
  member_since: string;
  representedProperties: Property[];
}

export interface PlatformSetting {
  setting_key: string;
  setting_value: number;
  description: string;
  updated_at: string;
}

export interface SecurityTestResult {
  testName: string;
  requirement: string;
  passed: boolean;
  details: string;
}
