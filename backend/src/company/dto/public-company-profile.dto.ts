/**
 * Public Company Profile DTO
 * Contains only safe, non-sensitive fields that can be shared with other users
 * EXCLUDED: bankInfo, kycDocuments, billingPreferences, deliveryAddresses
 */
export interface PublicCompanyProfileDto {
  _id: string;
  companyName: string;
  companyAddress: string;
  companyMobile: string;
  taxId: string;
  founderName: string;
  websiteUrl: string;
  role: string;
  tradeType: string;
  mainLineBusiness: string[];
  whatsappContact: string;
  primaryEmail: string;
  alternativeSalesEmail: string;
  profilePicture?: string;
  bannerImage?: string;
  isKycVerified: boolean;
  tradeDetails?: {
    emergingInterest?: string;
  };
}
