// Keep starter content compatible with the fields used by the public gallery and editor.
import { initialContent } from "./src/content.js";
type Project = {
  id: string;
  name: string;
  type: string;
  aspect: string;
  description: string;
  images: { url: string; alt: string }[];
};
type Film = {
  id: string;
  title: string;
  poster: string;
  video: string;
  quote: string;
  sample: boolean;
};
type Content = {
  headline: string;
  subtitle: string;
  hero: { image: string; label: string }[];
  projects: Project[];
  films: Film[];
  studioImage: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  whatsapp: string;
  pixel: string;
};
export const studioContent: Content = initialContent;
