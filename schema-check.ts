// Keep starter content compatible with the fields used by the public gallery and editor.
import { initialContent } from "./src/content.js";
type Project = {
  id: string;
  name: string;
  type: string;
  aspect: string;
  sector: string;
  workStatus: string;
  partnerIds: string[];
  description: string;
  images: { url: string; alt: string }[];
};
type Content = {
  headline: string;
  hero: { image: string; label: string }[];
  projects: Project[];
  partners: { id: string; name: string; role: string; bio: string }[];
  facebook: string;
  instagram: string;
  bangaloreAddress: string;
  hyderabadAddress: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  whatsapp: string;
  pixel: string;
};
export const studioContent: Content = initialContent;
