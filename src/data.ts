import { PortfolioItem, ServiceItem, AwardItem, ProofProject, TestimonialItem, InquiryItem } from './types';

export const PERSONAL_INFO = {
  name: "Govind Kumar Gella",
  title: "Award-Winning Photographer | Cinematographer | Diploma in Photography | Founder of GK Digital Studios",
  tagline: "Capturing Emotions. Creating Timeless Memories.",
  phone: "9491800783",
  email: "gkdigitalstudios@gmail.com",
  instagram: "https://www.instagram.com/gk_digital_studios?igsh=MWxmdWR5dTZnaG9oOQ%3D%3D&utm_source=qr",
  googleMaps: "https://maps.app.goo.gl/RTFV1iJCuF4beMSp7",
  aboutLong: `Photography is not just my profession—it is my passion. I am Govind Kumar Gella, Founder & Creative Director of GK Digital Studios, with over 6 years of professional experience in photography and cinematography. I hold a Diploma in Photography, which has strengthened my expertise in camera techniques, lighting, composition, color science, storytelling, and professional editing. My work focuses on creating elegant, emotional, and timeless visual stories that clients can cherish for generations. Whether it’s a wedding, portrait, commercial shoot, or cinematic film, I always strive to deliver premium-quality work with creativity and professionalism.`,
  location: "Andhra Pradesh, India",
  aboutImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  highlights: [
    { label: "Professional Experience", value: "6+ Years" },
    { label: "Technical Credentials", value: "Diploma in Photography" },
    { label: "International Recognition", value: "SAP Licentiate (LSAP)" },
    { label: "Client Base", value: "1000+ Happy Clients" },
    { label: "Completed Projects", value: "500+ Projects" },
    { label: "Specialization", value: "Premium Wedding & Cinematic Specialist" }
  ],
  stats: [
    { label: "Years Experience", value: "6+" },
    { label: "Projects Completed", value: "500+" },
    { label: "Happy Clients", value: "1000+" },
    { label: "National & International Awards", value: "Multiple" },
    { label: "Wedding & Cinematic Specialist", value: "Premium" }
  ],
  skills: [
    { name: "Photography & Composition", rating: 5 },
    { name: "Cinematography & Camera Movement", rating: 5 },
    { name: "Adobe Lightroom Retouching", rating: 5 },
    { name: "Adobe Photoshop Creative Editing", rating: 5 },
    { name: "Adobe Premiere Pro Editing", rating: 5 },
    { name: "DaVinci Resolve Color Grading", rating: 5 },
    { name: "Luxury Album Designing", rating: 5 },
    { name: "AI Creative Design & Branding", rating: 5 }
  ]
};

export const AWARDS: AwardItem[] = [
  {
    title: "SAP Licentiate – Photo Artist International (LSAP)",
    authority: "Sigma Academy of Photography",
    subtitle: "International Photography Distinction & Certificate of Excellence",
    description: "Awarded for outstanding artistic excellence and superior technical execution in international professional photography."
  },
  {
    title: "Photo Parivar India Awards 2026",
    authority: "Photo Parivar National Committee",
    subtitle: "Award Winner in Wedding Photography",
    description: "Recognized for excellence in capturing emotional candid stories and technical mastery in Indian wedding celebrations."
  },
  {
    title: "PPIN (Photo Parivar India Network)",
    authority: "Photo Parivar Professional Network",
    subtitle: "Professional Awardee",
    description: "Honored for major contributions to professional photography standards and continuous mentoring in visual storytelling."
  }
];

export const SERVICES: ServiceItem[] = [
  {
    title: "Wedding Photography",
    description: "Luxury wedding storytelling featuring documentary candids, royal portraits, and timeless emotional moments.",
    category: "Photography",
    details: ["Full-day coverage", "Dual photographer setup", "High-res edited gallery", "Creative lighting direction"]
  },
  {
    title: "Pre-Wedding Photography",
    description: "Creative destination love stories reflecting your unique chemistry in cinematic outdoor landscapes.",
    category: "Photography",
    details: ["Location assistance", "Styling consultancy", "Drone visual captures", "Cinematic trailer teaser"]
  },
  {
    title: "Cinematic Wedding Films",
    description: "Premium cinematic wedding movies with immersive sound design, emotional dialogue, and cinematic grade.",
    category: "Cinematography",
    details: ["4K cinematic cameras", "Pro audio recording", "3-5 minute highlights film", "Full event documentary film"]
  },
  {
    title: "Portrait Photography",
    description: "Professional indoor studio and outdoor location portraits focusing on authentic character and clean lighting.",
    category: "Photography",
    details: ["Business headshots", "Creative fashion portraits", "Retouching included", "Multiple outfit changes"]
  },
  {
    title: "Drone Photography & Video",
    description: "High-quality aerial photography and cinema-grade drone visuals that add grand perspectives to your events.",
    category: "Cinematography",
    details: ["4K aerial cinematic footage", "Licensed drone operations", "Top-down geometric compositions"]
  },
  {
    title: "Birthday & Event Coverage",
    description: "Comprehensive coverage of milestones, corporate celebrations, engagements, and cultural events.",
    category: "Photography",
    details: ["Dynamic coverage", "Quick sneak-peek delivery", "Candid moments focused"]
  },
  {
    title: "Commercial Photography",
    description: "High-end product, advertising, and branding imagery designed to elevate your business's visual footprint.",
    category: "AI & Luxury",
    details: ["Precision studio lighting", "Texture & detail enhancements", "E-commerce & editorial layouts"]
  },
  {
    title: "Album Designing",
    description: "Luxury wedding albums featuring customized minimalist layouts, thick archival paper, and premium covers.",
    category: "Editing",
    details: ["Custom curated spreads", "Archival printing quality", "Luxurious leather/linen covers", "Digital proofing preview"]
  },
  {
    title: "Professional Photo Editing",
    description: "Advanced post-processing workflow including professional skin retouching, HDR blending, and color science.",
    category: "Editing",
    details: ["Skin retouching & blemish removal", "HDR bracket-exposure blending", "Consistent color-grading styles", "Background cleaning"]
  },
  {
    title: "Professional Video Editing",
    description: "High-end post-production for films, short forms, Reels, and promos with dynamic audio, color grade, and motion graphics.",
    category: "Editing",
    details: ["DaVinci Resolve color grading", "Sound design & mastering", "Social Media Reels formatting", "Custom motion graphics"]
  },
  {
    title: "AI Creative Services",
    description: "Next-generation generative visuals, digital poster art, brand designs, and custom aesthetic content.",
    category: "AI & Luxury",
    details: ["AI concept visualization", "Premium marketing posters", "Digital business branding", "Social media templates"]
  }
];

export const PORTFOLIO: PortfolioItem[] = [
  // Weddings
  {
    id: "wed-1",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    title: "Royal Crimson Mandap",
    category: "Weddings",
    description: "An elegant traditional South Indian wedding ceremony decorated in deep crimsons and golden marigolds."
  },
  {
    id: "wed-2",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    title: "Whispers of Forever",
    category: "Weddings",
    description: "A candid moment of joy as the newlyweds share their first sunset walk together."
  },
  {
    id: "wed-3",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    title: "The Auspicious Knot",
    category: "Weddings",
    description: "Captured during the sacred Mangalasutra ceremony, freezing a split-second of raw emotion."
  },
  {
    id: "wed-4",
    url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
    title: "Vows in Metal & Skin",
    category: "Weddings",
    description: "Detailed macro-photography of the wedding rings resting on henna-adorned hands."
  },

  // Pre-Weddings
  {
    id: "pre-1",
    url: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&w=1200&q=80",
    title: "Coastal Reverie",
    category: "Pre-Weddings",
    description: "A wide, artistic composition of a couple walking along the mist-filled beach of Visakhapatnam."
  },
  {
    id: "pre-2",
    url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
    title: "Golden Hour Embrace",
    category: "Pre-Weddings",
    description: "Backlit portrait of lovers laughing into the warm autumn sunset."
  },
  {
    id: "pre-3",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
    title: "Joyous Woodlands",
    category: "Pre-Weddings",
    description: "Chasing light in deep forest trails, showing natural chemistry and casual vibes."
  },

  // Portraits
  {
    id: "port-1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
    title: "Elegance Restored",
    category: "Portraits",
    description: "A professional studio portrait showcasing fine-art lighting and flawless textures."
  },
  {
    id: "port-2",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
    title: "The Classical Man",
    category: "Portraits",
    description: "Classic high-contrast monochrome study reflecting character, depth, and composition."
  },
  {
    id: "port-3",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80",
    title: "Chiaroscuro Muse",
    category: "Portraits",
    description: "Natural window light falling dramatically on the subject, accentuating emotional tone."
  },

  // Events
  {
    id: "event-1",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    title: "The Corporate Summit",
    category: "Events",
    description: "A wide-angle landscape depicting state-of-the-art stage lighting and high-profile networking."
  },
  {
    id: "event-2",
    url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    title: "Sparkler Carnival",
    category: "Events",
    description: "Milestone celebration highlighted by cold spark fountains and cheerful crowds."
  },
  {
    id: "event-3",
    url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
    title: "Neon Revelry",
    category: "Events",
    description: "Vibrant party lighting capturing high energy and beautiful reflections."
  },

  // Drone
  {
    id: "drone-1",
    url: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1200&q=80",
    title: "Tides & Contours",
    category: "Drone",
    description: "Overhead aerial geometry showing ocean wave white-wash colliding with majestic black coast rocks."
  },
  {
    id: "drone-2",
    url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80",
    title: "Emerald Gateway",
    category: "Drone",
    description: "A perfectly symmetrical top-down view of a dense forest road flanked by ancient trees."
  },
  {
    id: "drone-3",
    url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80",
    title: "High Mountain Curves",
    category: "Drone",
    description: "Panoramic dramatic view of a winding pass cutting through beautiful green hills."
  },

  // Commercial
  {
    id: "comm-1",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    title: "Archival Horizon Watch",
    category: "Commercial",
    description: "Product campaign focusing on micro-textures and pristine metallic studio reflections."
  },
  {
    id: "comm-2",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    title: "Aural Sanctuary",
    category: "Commercial",
    description: "High-key catalog advertisement for luxury noise-cancelling headphones."
  },
  {
    id: "comm-3",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    title: "Monolith Lines",
    category: "Commercial",
    description: "Corporate real estate portfolio featuring geometric architectural elevations under glass skies."
  },

  // AI Creations
  {
    id: "ai-1",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    title: "Neon Sanctuary",
    category: "AI Creations",
    description: "A dreamy cybernetic botanical garden created through custom generative prompts and post-grading."
  },
  {
    id: "ai-2",
    url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
    title: "Chrome Topography",
    category: "AI Creations",
    description: "A highly complex rendering of molten metal topography showing beautiful, iridescent color spectrums."
  },
  {
    id: "ai-3",
    url: "https://images.unsplash.com/photo-1617791160505-6f006e121980?auto=format&fit=crop&w=1200&q=80",
    title: "Sky Temple Portal",
    category: "AI Creations",
    description: "Generative surrealism portraying floating stone gates among clouds in perfect symmetry."
  }
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    name: "Karthik & Pooja",
    role: "Wedding Clients",
    quote: "Outstanding photography with premium editing. Every picture tells a beautiful story. Govind is incredibly professional and captures the soul of the event.",
    rating: 5
  },
  {
    name: "Dr. Srinivas Rao",
    role: "Event Organizer",
    quote: "Highly professional, creative, and friendly. We couldn’t have asked for better wedding and reception photographers. The drone shots were cinematic masterpiece!",
    rating: 5
  },
  {
    name: "Aditi Sharma",
    role: "Fashion Designer",
    quote: "GK Digital Studios exceeded all our expectations. The commercial catalog portraits are elite and clean. Delivery was super fast, highly recommended.",
    rating: 5
  }
];

export const INITIAL_PROOFING_PROJECTS: ProofProject[] = [
  {
    id: "GK-LOVE-2026",
    clientName: "Rahul & Priya",
    clientPhone: "9491800783",
    clientEmail: "rahul.priya@gmail.com",
    passcode: "LOVE2026",
    date: "July 12, 2026",
    category: "Weddings",
    description: "Review your cinematic wedding photographs and select the final 5 photos for your Premium Gold Archival Album.",
    status: "reviewing",
    videos: [
      {
        id: "v1-1",
        title: "Cinematic Wedding Teaser Trailer (4K)",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Embed preview URL
        thumbnailUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
        duration: "3 min 45 sec",
        description: "Official 4K cinematic trailer featuring the Muhurtham and Sangeet highlights."
      },
      {
        id: "v1-2",
        title: "Drone Aerial Highlights - Visakhapatnam Beach Resort",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnailUrl: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1200&q=80",
        duration: "2 min 10 sec",
        description: "Breathtaking 4K drone entry and coastal ceremony visuals."
      }
    ],
    images: [
      {
        id: "p1-1",
        url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        title: "Mandap Overview (Pooja & Rituals)",
        selected: false,
        comment: ""
      },
      {
        id: "p1-2",
        url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
        title: "First Sunset Kiss (Golden Hour)",
        selected: true,
        comment: "Please retouch the stray hair on the left side and enhance the sunset glow."
      },
      {
        id: "p1-3",
        url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
        title: "Mangalasutra Ceremony Close-up",
        selected: false,
        comment: ""
      },
      {
        id: "p1-4",
        url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
        title: "Rings & Henna Detail Shot",
        selected: true,
        comment: "Perfect details! Crop it slightly tighter around the ring finger."
      },
      {
        id: "p1-5",
        url: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&w=1200&q=80",
        title: "Smiles at the Reception Stage",
        selected: false,
        comment: ""
      },
      {
        id: "p1-6",
        url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
        title: "Bride's Portrait (Close up)",
        selected: true,
        comment: "Stunning shot! Please do standard skin retouching and remove the spotlight reflection in the eyes."
      }
    ]
  },
  {
    id: "GK-PORT-2026",
    clientName: "Aarav Sharma",
    clientPhone: "9876543210",
    clientEmail: "aarav.sharma@gmail.com",
    passcode: "PORT2026",
    date: "June 30, 2026",
    category: "Portraits",
    description: "Select 2 editorial branding headshots from this high-contrast black-and-white studio set.",
    status: "reviewing",
    images: [
      {
        id: "p2-1",
        url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
        title: "Classic Monochrome Headshot",
        selected: true,
        comment: "Excellent high-contrast tone. Just a slight skin cleanup."
      },
      {
        id: "p2-2",
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80",
        title: "Warm Soft Silhouette",
        selected: false,
        comment: ""
      },
      {
        id: "p2-3",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
        title: "Editorial Lighting Angle",
        selected: false,
        comment: ""
      }
    ]
  }
];

export const INITIAL_EVENT_INQUIRIES: InquiryItem[] = [
  {
    id: "inq-101",
    name: "Rajesh Varma",
    phone: "9491800783",
    email: "gkdigitalstudios@gmail.com",
    service: "Wedding Photography",
    message: "Hi Govind, we are looking for full-day wedding coverage and cinematic film in Visakhapatnam on Nov 14th, 2026. Please share package details.",
    submittedAt: "2026-07-22 10:30 AM",
    status: "new"
  },
  {
    id: "inq-102",
    name: "Priyanka Roy",
    phone: "9876543210",
    email: "priyanka.roy@gmail.com",
    service: "Pre-Wedding Shoot",
    message: "Hello! We would like to schedule a 2-day outdoor pre-wedding photo & reel shoot in Araku Valley in September. Kindly share availability.",
    submittedAt: "2026-07-21 04:15 PM",
    status: "contacted"
  },
  {
    id: "inq-103",
    name: "Suresh Chowdary",
    phone: "9123456789",
    email: "suresh.c@outlook.com",
    service: "Drone Aerial Visuals",
    message: "Need 4K drone cinematography for a 3-day corporate inauguration and grand reception event in Vijayawada.",
    submittedAt: "2026-07-20 02:45 PM",
    status: "confirmed"
  }
];

