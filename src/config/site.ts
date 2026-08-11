export const siteConfig = {
  name: "JhapaRide",
  tagline: "Your Ride. Your Jhapa.",
  description:
    "Book safe and affordable bike and car rides across Jhapa with JhapaRide.",
  region: "Jhapa, Nepal",
  currency: "NPR",
  phoneCode: "+977",
  supportEmail: "support@jhaparide.example",
  supportPhone: "+977-1XX-XXXXXX",
  url: "https://jhaparide.example",
} as const;

export const mainNav = [
  { title: "Home", href: "/" },
  { title: "How It Works", href: "/how-it-works" },
  { title: "Services", href: "/services" },
  { title: "Safety", href: "/safety" },
  { title: "Become a Rider", href: "/become-a-rider" },
  { title: "Help", href: "/help" },
] as const;

export const footerNav = {
  company: [
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "Careers", href: "/careers" },
  ],
  services: [
    { title: "Bike", href: "/services#bike" },
    { title: "Car", href: "/services#car" },
    { title: "Parcel", href: "/services#parcel" },
  ],
  support: [
    { title: "Help Center", href: "/help" },
    { title: "Safety", href: "/safety" },
    { title: "Contact Support", href: "/contact" },
  ],
  legal: [
    { title: "Terms", href: "/terms" },
    { title: "Privacy", href: "/privacy" },
    { title: "Cancellation Policy", href: "/cancellation-policy" },
    { title: "Refund Policy", href: "/refund-policy" },
  ],
} as const;
