export const company = "Discrete Art Studio LLP";
export const cities = ["Bangalore", "Hyderabad"];
export const sectors = ["Residential", "Commercial"];
export const workStatuses = ["Unassigned", "Ongoing", "Completed"];
export const partnerFocus = [...sectors, "Residential and commercial"];
export const studioLocations = {
  Bangalore: "Karnataka",
  Hyderabad: "Telangana",
};
export const initialContent = {
  headline: "The art of\nliving well.",
  hero: [
    { image: "/media/hero.webp", label: "Courtyard House" },
    { image: "/media/dining.webp", label: "The Walnut Dining Room" },
    { image: "/media/cafe.webp", label: "The Terracotta Café" },
  ],
  partners: [],
  projects: [
    {
      id: "courtyard-house",
      workStatus: "Ongoing",
      name: "Courtyard House",
      type: "Residential concept",
      sector: "Residential",
      partnerIds: [],
      aspect: "4/5",
      description:
        "An arched threshold opens a timber-lined living room to the garden. A curved, low sofa follows the line of the courtyard.",
      images: [
        {
          url: "/media/courtyard-portrait.webp",
          alt: "The timber living room and its arched courtyard opening",
        },
        {
          url: "/media/hero.webp",
          alt: "A wide courtyard view with a curved caramel sofa",
        },
      ],
    },
    {
      id: "terracotta-cafe",
      workStatus: "Completed",
      name: "The Terracotta Café",
      type: "Hospitality concept",
      sector: "Commercial",
      partnerIds: [],
      aspect: "5/4",
      description:
        "Burnt sienna walls and warm light set the mood for a sequence of intimate tables.",
      images: [
        { url: "/media/cafe.webp", alt: "Terracotta-toned café seating" },
        {
          url: "/media/cafe-portrait.webp",
          alt: "A vertical view of the café interior",
        },
        { url: "/media/cafe-detail.webp", alt: "A café material detail" },
      ],
    },
    {
      id: "oak-kitchen",
      workStatus: "Ongoing",
      name: "Oak & Travertine",
      type: "Kitchen concept",
      sector: "Residential",
      partnerIds: [],
      aspect: "5/4",
      description:
        "A quiet kitchen palette built around the grain of oak and the texture of pale stone.",
      images: [
        {
          url: "/media/kitchen.webp",
          alt: "A contemporary oak and travertine kitchen",
        },
        {
          url: "/media/kitchen-detail.webp",
          alt: "A closer view of the kitchen materials",
        },
      ],
    },
    {
      id: "olive-room",
      workStatus: "Completed",
      name: "The Olive Room",
      type: "Bedroom concept",
      sector: "Residential",
      partnerIds: [],
      aspect: "4/5",
      description:
        "Olive linen and a layered neutral palette bring softness to a restful bedroom.",
      images: [
        {
          url: "/media/bedroom.webp",
          alt: "A bedroom with olive linen and layered neutrals",
        },
        { url: "/media/bedroom-detail.webp", alt: "Details at the bedside" },
      ],
    },
    {
      id: "limestone-atelier",
      workStatus: "Ongoing",
      name: "The Limestone Atelier",
      type: "Retail concept",
      sector: "Commercial",
      partnerIds: [],
      aspect: "5/4",
      description:
        "Arched display niches and pale limestone set a measured rhythm through a boutique interior.",
      images: [
        {
          url: "/media/boutique.webp",
          alt: "A limestone boutique with arched display niches",
        },
        {
          url: "/media/boutique-detail.webp",
          alt: "A detail of the boutique display",
        },
      ],
    },
    {
      id: "walnut-table",
      workStatus: "Completed",
      name: "The Walnut Dining Room",
      type: "Dining concept",
      sector: "Residential",
      partnerIds: [],
      aspect: "4/5",
      description:
        "A walnut table, cane seats and a paper pendant define a room for unhurried meals.",
      images: [
        {
          url: "/media/dining-portrait.webp",
          alt: "A walnut dining table with cane chairs",
        },
        {
          url: "/media/dining.webp",
          alt: "The dining room beneath a soft paper pendant",
        },
      ],
    },
  ],
  city: "",
  address: "",
  bangaloreAddress:
    "130K, 19th A Main, 1st K Block, Rajajinagar, Bangalore 560010",
  hyderabadAddress: "",
  instagram: "https://www.instagram.com/discreteartstudio/",
  facebook:
    "https://www.facebook.com/people/Discrete-Art-Studio/61574644563327/",
  email: "info@discretearts.com",
  phone: "",
  whatsapp: "",
  pixel: "",
};
export const scopes = [
  "Woodwork",
  "Woodwork + False Ceiling",
  "End-to-End Interiors",
  "A Few Rooms Only",
];
export const bedrooms = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK+",
  "Commercial space",
];

// Keep previously saved CMS content usable without changing the owner's edits.
export function withPortfolioDefaults(saved) {
  const content = { ...initialContent, ...saved };
  return {
    ...content,
    projects: content.projects.map((p) => ({
      sector: /commercial|retail|hospitality|office/i.test(p.type)
        ? "Commercial"
        : "Residential",
      partnerIds: [],
      workStatus: "Unassigned",
      ...p,
    })),
  };
}
