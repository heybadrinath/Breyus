export class UserDetailsDto {
  // Contact Information
  contactNumber?: string;
  alternateNumber1?: string;
  alternateNumber2?: string;
  alternateEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;

  // Company Information
  companyName?: string;
  companyWebsite?: string;
  gstin?: string;
  companyAddress?: string;
  socials?: string;

  // Bank Details
  accountType?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
} 