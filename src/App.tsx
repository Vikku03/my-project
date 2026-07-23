import React, { useState, useMemo, useEffect } from "react";
import { 
  Camera, 
  Video, 
  Award, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Check, 
  Lock, 
  Unlock, 
  Send, 
  Share2, 
  Download, 
  ZoomIn, 
  Heart, 
  MessageSquare, 
  Plus, 
  Search, 
  Star, 
  Sliders, 
  ChevronRight, 
  ChevronDown,
  Sparkles, 
  Menu, 
  X, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  Trash2,
  LogOut,
  Instagram,
  Youtube,
  Facebook,
  ShieldCheck,
  User,
  KeyRound,
  Smartphone,
  ExternalLink,
  ChevronLeft,
  Edit,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  PERSONAL_INFO, 
  AWARDS, 
  SERVICES, 
  PORTFOLIO, 
  TESTIMONIALS, 
  INITIAL_PROOFING_PROJECTS,
  INITIAL_EVENT_INQUIRIES
} from "./data";
import { PortfolioItem, ServiceItem, AwardItem, ProofProject, ProofImage, TestimonialItem, UserSession, InquiryItem, PersonalInfoData } from "./types";
import { LoginModal } from "./components/LoginModal";
import { AdminDashboard } from "./components/AdminDashboard";
import { ClientPortal } from "./components/ClientPortal";
import { PortfolioModal } from "./components/PortfolioModal";
import { DeletePortfolioModal } from "./components/DeletePortfolioModal";
import { EditAboutModal } from "./components/EditAboutModal";
import { resolveImageUrl } from "./utils/media";
import { deleteFileFromAWS, saveUsersToAWS, loadUsersFromAWS } from "./lib/aws";

type TabType = "home" | "portfolio" | "services" | "proofing" | "about" | "contact";

export default function App() {
  // Navigation & Hash Route Sync
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const hash = window.location.hash.replace("#", "");
    if (["home", "portfolio", "services", "proofing", "about", "contact"].includes(hash)) {
      return hash as TabType;
    }
    return "home";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync Hash on Tab Switch
  const navigateToPage = (tab: TabType) => {
    setActiveTab(tab);
    window.location.hash = tab;
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["home", "portfolio", "services", "proofing", "about", "contact"].includes(hash)) {
        setActiveTab(hash as TabType);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Main Website Portfolio State with Persistence
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    try {
      const saved = localStorage.getItem("gk_main_portfolio");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not read saved main portfolio:", e);
    }
    return PORTFOLIO;
  });

  // Portfolio Modals State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [portfolioToDelete, setPortfolioToDelete] = useState<PortfolioItem | null>(null);

  // Save Portfolio to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gk_main_portfolio", JSON.stringify(portfolio));
    } catch (e) {
      console.warn("Could not save main portfolio to localStorage:", e);
    }
  }, [portfolio]);

  // Portfolio Handlers
  const handleOpenAddPortfolioModal = () => {
    setEditingPortfolioItem(null);
    setShowPortfolioModal(true);
  };

  const handleOpenEditPortfolioModal = (item: PortfolioItem) => {
    setEditingPortfolioItem(item);
    setShowPortfolioModal(true);
  };

  const handleSavePortfolioItem = (itemData: { id?: string; title: string; category: PortfolioItem['category']; description: string; url: string }) => {
    if (itemData.id) {
      setPortfolio(prev => prev.map(item => item.id === itemData.id ? { ...item, ...itemData } : item));
    } else {
      const newItem: PortfolioItem = {
        id: `port-${Date.now()}`,
        title: itemData.title,
        category: itemData.category,
        description: itemData.description,
        url: itemData.url
      };
      setPortfolio(prev => [newItem, ...prev]);
    }
  };

  const handleConfirmDeletePortfolio = (id: string) => {
    const targetItem = portfolio.find(item => item.id === id);
    if (targetItem && targetItem.url) {
      deleteFileFromAWS(targetItem.url).catch(err => console.warn('Portfolio S3 delete error:', err));
    }
    setPortfolio(prev => prev.filter(item => item.id !== id));
    setPortfolioToDelete(null);
  };

  // Portfolio Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLightboxImage, setActiveLightboxImage] = useState<PortfolioItem | null>(null);

  // Client Proofing & Admin Projects State
  const [proofingProjects, setProofingProjects] = useState<ProofProject[]>(() => {
    try {
      const saved = localStorage.getItem("gk_proofing_projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: ProofProject) => ({
            ...p,
            images: Array.isArray(p.images) ? p.images : [],
            videos: Array.isArray(p.videos) ? p.videos : []
          }));
        }
      }
    } catch (e) {
      console.error("Error reading saved proofing projects:", e);
    }
    return INITIAL_PROOFING_PROJECTS;
  });

  // Personal Info State (Editable by Admin, persisted in localStorage)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>(() => {
    try {
      const saved = localStorage.getItem("gk_personal_info");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not parse saved personal info:", e);
    }
    return PERSONAL_INFO;
  });

  const [showEditAboutModal, setShowEditAboutModal] = useState(false);

  // Save personal info to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gk_personal_info", JSON.stringify(personalInfo));
    } catch (e) {
      console.warn("Could not save personal info:", e);
    }
  }, [personalInfo]);

  // User Session State (Client / Admin Login)
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const savedSession = localStorage.getItem("gk_user_session");
      return savedSession ? JSON.parse(savedSession) : null;
    } catch (e) {
      console.error("Error reading saved session:", e);
      return null;
    }
  });

  const [headerProfileMenuOpen, setHeaderProfileMenuOpen] = useState(false);

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Contact Form & Event Inquiries State
  const [eventInquiries, setEventInquiries] = useState<InquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem("gk_event_inquiries");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not parse saved inquiries:", e);
    }
    return INITIAL_EVENT_INQUIRIES;
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Wedding Photography",
    message: "",
  });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Save event inquiries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gk_event_inquiries", JSON.stringify(eventInquiries));
    } catch (e) {
      console.warn("Could not save event inquiries:", e);
    }
  }, [eventInquiries]);

  // Handle Inquiry Form Submission -> Save to Admin Table & Auto-Redirect to WhatsApp
  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return;

    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}`,
      name: contactForm.name.trim(),
      phone: contactForm.phone.trim(),
      email: contactForm.email.trim() || "N/A",
      service: contactForm.service || "Wedding Photography",
      message: contactForm.message.trim(),
      submittedAt: new Date().toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: "new"
    };

    setEventInquiries(prev => [newInquiry, ...prev]);
    setContactSuccess(true);

    // Format pre-filled WhatsApp Message
    const waMessage = 
      `Hello *GK Digital Studios*! 👋\n\n` +
      `I would like to submit an *Event Booking Inquiry* with the following details:\n\n` +
      `👤 *Full Name:* ${contactForm.name.trim()}\n` +
      `📞 *Phone Number:* ${contactForm.phone.trim()}\n` +
      `✉️ *Email Address:* ${contactForm.email.trim() || 'N/A'}\n` +
      `📷 *Service Requested:* ${contactForm.service || 'Wedding Photography'}\n\n` +
      `📝 *Event Details / Message:*\n"${contactForm.message.trim()}"\n\n` +
      `Please share date availability, portfolio, and pricing packages. Thank you!`;

    const encodedMsg = encodeURIComponent(waMessage);
    const waUrl = `https://wa.me/919491800783?text=${encodedMsg}`;

    setTimeout(() => {
      window.open(waUrl, "_blank");
    }, 400);
  };


  // Load users/projects from AWS S3 Cloud Storage on initial app boot
  useEffect(() => {
    loadUsersFromAWS().then((remoteProjects) => {
      if (Array.isArray(remoteProjects) && remoteProjects.length > 0) {
        setProofingProjects(remoteProjects);
      }
    }).catch(err => {
      console.warn("Could not load users from AWS S3 on app boot:", err);
    });
  }, []);

  // Save changes to local persistence & AWS S3 Cloud Storage automatically
  useEffect(() => {
    try {
      localStorage.setItem("gk_proofing_projects", JSON.stringify(proofingProjects));
      saveUsersToAWS(proofingProjects).catch(e => console.warn("Could not sync users data to AWS S3:", e));
    } catch (e) {
      console.warn("Could not save proofing projects to localStorage:", e);
    }
  }, [proofingProjects]);

  useEffect(() => {
    try {
      if (userSession) {
        localStorage.setItem("gk_user_session", JSON.stringify(userSession));
      } else {
        localStorage.removeItem("gk_user_session");
      }
    } catch (e) {
      console.warn("Could not save user session to localStorage:", e);
    }
  }, [userSession]);

  // Handle auto-navigating to Contact Form for a service
  const handleInquireService = (serviceTitle: string) => {
    setContactForm(prev => ({ ...prev, service: serviceTitle }));
    navigateToPage("contact");
  };

  // Categories
  const categories = ["All", "Weddings", "Pre-Weddings", "Portraits", "Events", "Drone", "Commercial", "AI Creations"];

  // Filtered portfolio
  const filteredPortfolio = useMemo(() => {
    return portfolio.filter(item => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch = (item?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                            (item?.description || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [portfolio, selectedCategory, searchQuery]);

  // Login success callback
  const handleLoginSuccess = (session: UserSession, assignedProject?: ProofProject) => {
    setUserSession(session);
    navigateToPage("proofing");
  };

  // Handle Logout
  const handleLogout = () => {
    setUserSession(null);
  };

  // Active assigned client project
  const assignedClientProject = useMemo(() => {
    if (!userSession || userSession.role !== "client") return null;
    if (userSession.assignedProjectId) {
      return proofingProjects.find(p => p.id === userSession.assignedProjectId) || proofingProjects[0];
    }
    return proofingProjects[0];
  }, [userSession, proofingProjects]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950">
      
      {/* GLOBAL HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Name */}
          <button 
            onClick={() => navigateToPage("home")}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-amber-400 font-black text-lg">
                GK
              </div>
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-wider text-white group-hover:text-amber-400 transition">
                GK DIGITAL STUDIOS
              </div>
              <div className="text-[10px] tracking-widest text-zinc-400 font-medium uppercase">
                Official Studio Website
              </div>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-sm">
            {[
              { id: "home", label: "Home" },
              { id: "portfolio", label: "Galleries" },
              { id: "services", label: "Services" },
              { id: "about", label: "About" },
              { id: "contact", label: "Contact" },
            ].map(nav => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => navigateToPage(nav.id as TabType)}
                  className={`px-4 py-2 rounded-xl transition text-sm ${
                    isActive 
                      ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30" 
                      : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Contact / Client Login CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {userSession ? (
              <div className="relative">
                <button
                  onClick={() => setHeaderProfileMenuOpen(!headerProfileMenuOpen)}
                  className="bg-amber-500/10 border border-amber-500/40 text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 hover:bg-amber-500/20 group"
                  title="Click to view profile & logout options"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                    {((userSession.name || "User").split(" ").map(n => n[0]).join("") || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <span>{userSession.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-200 ${headerProfileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Popup Overlay (Matching user reference design) */}
                {headerProfileMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setHeaderProfileMenuOpen(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white text-zinc-900 rounded-2xl p-4 shadow-2xl border border-zinc-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {((userSession.name || "User").split(" ").map(n => n[0]).join("") || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-zinc-900 text-sm truncate leading-tight">
                            {userSession.name}
                          </h4>
                          <p className="text-xs text-zinc-500 font-normal mt-0.5 truncate">
                            {userSession.email || (userSession.role === "admin" ? "vikranthabv@gmail.com" : "client@gmail.com")}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        {activeTab !== "proofing" && (
                          <button
                            onClick={() => {
                              setHeaderProfileMenuOpen(false);
                              navigateToPage("proofing");
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition flex items-center gap-2"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Go to {userSession.role === "admin" ? "Studio Dashboard" : "Client Gallery"}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setHeaderProfileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition flex items-center gap-2.5"
                        >
                          <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/10"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            <a
              href={personalInfo.instagram}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-zinc-900 hover:bg-pink-950/50 text-pink-400 hover:text-pink-300 rounded-xl border border-zinc-800 hover:border-pink-500/40 transition"
              title="Visit Instagram Page (@gk_digital_studios)"
            >
              <Instagram className="w-4 h-4" />
            </a>

            <a
              href={personalInfo.googleMaps}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-zinc-900 hover:bg-sky-950/50 text-sky-400 hover:text-sky-300 rounded-xl border border-zinc-800 hover:border-sky-500/40 transition"
              title="View Studio Location on Google Maps"
            >
              <MapPin className="w-4 h-4" />
            </a>

            <a
              href={`tel:${personalInfo.phone}`}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-xl border border-zinc-800 transition"
              title="Call Studio"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 text-zinc-300 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-lg px-4 py-4 space-y-2"
            >
              {[
                { id: "home", label: "Home" },
                { id: "portfolio", label: "Galleries" },
                { id: "services", label: "Services" },
                { id: "about", label: "About & Awards" },
                { id: "contact", label: "Contact Us" },
              ].map(nav => (
                <button
                  key={nav.id}
                  onClick={() => navigateToPage(nav.id as TabType)}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition ${
                    activeTab === nav.id ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {nav.label}
                </button>
              ))}

              <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-2">
                {userSession ? (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigateToPage("proofing"); }}
                      className="flex-1 py-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>{userSession.name}</span>
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                      className="py-3 px-3 bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl text-center border border-rose-500/40 flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setMobileMenuOpen(false); setShowLoginModal(true); }}
                    className="flex-1 py-3 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl text-center"
                  >
                    Login
                  </button>
                )}
                <a
                  href={personalInfo.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-3 bg-zinc-800 text-pink-400 font-bold text-xs rounded-xl text-center border border-zinc-700 flex items-center justify-center gap-1"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
                <a
                  href={personalInfo.googleMaps}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-3 bg-zinc-800 text-sky-400 font-bold text-xs rounded-xl text-center border border-zinc-700 flex items-center justify-center gap-1"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Maps</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* PAGE 1: HOME PAGE */}
      {activeTab === "home" && (
        <main className="space-y-24 pb-24">
          
          {/* Atmospheric Smoke Hero Section */}
          <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden pt-16 pb-20 px-4 bg-smoke-hero">
            {/* Subtle smoke texture vignette overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(9,9,11,0.85)_100%)]" />

            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
              {/* Top Glass Pill Tag */}
              <div className="inline-flex">
                <span className="pill-badge border-amber-500/30 text-amber-300 bg-zinc-900/80 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>DRIVEN BY PASSION • GK DIGITAL STUDIOS</span>
                </span>
              </div>

              {/* Headline matching image style */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] font-sans">
                Timeless by design. <br />
                <span className="text-zinc-400 font-light italic">Captured with passion.</span>
              </h1>

              {/* Subtitle - Professional & Neat */}
              <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                Official studio portfolio of Govind Kumar Gella — Crafting cinematic visual legacies, royal South Indian wedding films, fine art portraiture, and high-resolution aerial cinematography.
              </p>

              {/* Centered Pill Action Button */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => navigateToPage("portfolio")}
                  className="pill-badge text-sm px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-700/80 hover:border-amber-500/50 transition shadow-2xl group flex items-center gap-2"
                >
                  <span>Explore Visual Galleries</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
                </button>

                <button
                  onClick={() => setShowLoginModal(true)}
                  className="pill-badge text-sm px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold border-transparent transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Client Login & Proofing</span>
                </button>
              </div>

              {/* Brand & Specialty Strip */}
              <div className="pt-16 space-y-4">
                <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase font-semibold">
                  TRUSTED BY HUNDREDS OF FAMILIES & CLIENTS NATIONWIDE
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-500 font-extrabold text-sm opacity-60">
                  <span className="hover:text-amber-400 transition cursor-default">ROYAL WEDDINGS</span>
                  <span className="text-zinc-700">•</span>
                  <span className="hover:text-amber-400 transition cursor-default">4K CINEMATOGRAPHY</span>
                  <span className="text-zinc-700">•</span>
                  <span className="hover:text-amber-400 transition cursor-default">FINE ART PORTRAITS</span>
                  <span className="text-zinc-700">•</span>
                  <span className="hover:text-amber-400 transition cursor-default">DRONE AERIALS</span>
                </div>
              </div>
            </div>
          </section>

          {/* Statement & Metrics Snapshot Section (Matching the Reference Image Stat Divider Bar) */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              {/* Center Circle Icon */}
              <div className="w-12 h-12 rounded-full bg-zinc-900/90 border border-zinc-800 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
                <Camera className="w-6 h-6" />
              </div>

              <p className="text-xl sm:text-2xl text-zinc-200 font-medium leading-relaxed font-sans">
                Our team of photographers, cinematographers, and visual storytellers craft tailored visual solutions that capture real-world emotions across generations.
              </p>

              <button
                onClick={() => navigateToPage("about")}
                className="pill-badge text-xs px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800"
              >
                <span>LEARN ABOUT GOVIND KUMAR GELLA</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

            {/* Metric Snapshot Bar with Vertical Line Dividers (Exact match to reference photo!) */}
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80 shadow-2xl">
              <div className="text-center p-4 space-y-1">
                <p className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                  EXPERIENCE SNAPSHOT
                </p>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-sans">
                  6+ <span className="text-amber-400 text-2xl">YRS</span>
                </div>
                <p className="text-xs text-zinc-400">Professional Excellence</p>
              </div>

              <div className="text-center p-4 space-y-1">
                <p className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                  EVENTS COVERED
                </p>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-sans">
                  250+
                </div>
                <p className="text-xs text-zinc-400">Weddings & Projects</p>
              </div>

              <div className="text-center p-4 space-y-1">
                <p className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                  CLIENT TRUST
                </p>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-sans">
                  99%
                </div>
                <p className="text-xs text-zinc-400">Satisfaction Score</p>
              </div>

              <div className="text-center p-4 space-y-1">
                <p className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                  DIPLOMA & SAP
                </p>
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-sans">
                  LSAP
                </div>
                <p className="text-xs text-zinc-400">International Distinction</p>
              </div>
            </div>
          </section>

          {/* Quick Showcase Categories */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex">
                <span className="pill-badge text-[11px] text-amber-400 border-amber-500/20 bg-amber-500/10">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>FEATURED GALLERIES</span>
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Where moments meet clarity
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                Explore selected wedding stories, portraits, and drone cinematography.
              </p>
            </div>

            <div className="flex justify-end items-center gap-3 pb-2">
              {userSession?.role === 'admin' && (
                <button
                  onClick={handleOpenAddPortfolioModal}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Image</span>
                </button>
              )}
              <button
                onClick={() => navigateToPage("portfolio")}
                className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1"
              >
                <span>View All Works ({portfolio.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.slice(0, 6).map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => { setActiveLightboxImage(item); }}
                  className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-amber-500/50 transition duration-300"
                >
                  <div className="aspect-[4/3] bg-zinc-950 overflow-hidden relative">
                    <img 
                      src={resolveImageUrl(item.url)} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {/* Hover Edit/Delete overlay - Admin Only */}
                    {userSession?.role === 'admin' && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditPortfolioModal(item);
                          }}
                          className="p-2 bg-zinc-950/80 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 rounded-xl backdrop-blur-md border border-amber-500/30 transition shadow-md"
                          title="Edit Photo Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPortfolioToDelete(item);
                          }}
                          className="p-2 bg-zinc-950/80 hover:bg-rose-600 hover:text-white text-rose-400 rounded-xl backdrop-blur-md border border-rose-500/30 transition shadow-md"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-90 transition pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 p-5 space-y-1 pointer-events-none">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">{item.title}</h3>
                    <p className="text-xs text-zinc-300 line-clamp-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Client Portal Highlight Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-zinc-900 via-amber-950/30 to-zinc-900 border border-amber-500/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
              <div className="max-w-2xl space-y-6 relative z-10">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                  Client & Admin Hub
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Secure Client Proofing & Asset Manager
                </h2>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  Log in with Google, Phone Number OTP, or Project Passcode to select your album photos, watch HD cinematic wedding videos, and communicate directly with Studio Founder Govind Kumar Gella.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
                  >
                    Client & Admin Sign In
                  </button>

                  <button
                    onClick={() => navigateToPage("proofing")}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-3.5 rounded-xl text-sm border border-zinc-700 transition"
                  >
                    Learn About Proofing
                  </button>
                </div>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* PAGE 2: GALLERIES PAGE */}
      {activeTab === "portfolio" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
          {/* Breadcrumb & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <button onClick={() => navigateToPage("home")} className="hover:text-amber-400">Home</button>
                <span>/</span>
                <span className="text-amber-400 font-bold">Galleries</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Galleries & Visual Works</h1>
              <p className="text-zinc-400 text-sm max-w-2xl">
                Curated showcase of high-resolution photography, royal South Indian weddings, pre-weddings, portraits, drone landscapes, and commercial works by Govind Kumar Gella.
              </p>
            </div>

            {userSession?.role === 'admin' && (
              <button
                onClick={handleOpenAddPortfolioModal}
                className="self-start sm:self-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Website Image</span>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    selectedCategory === cat 
                      ? "bg-amber-500 text-zinc-950 font-bold shadow-md" 
                      : "bg-zinc-800/80 text-zinc-300 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolio.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Photos Found</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  No portfolio images match your filter or search query.
                </p>
                {userSession?.role === 'admin' && (
                  <button
                    onClick={handleOpenAddPortfolioModal}
                    className="px-4 py-2.5 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload New Photo</span>
                  </button>
                )}
              </div>
            ) : (
              filteredPortfolio.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setActiveLightboxImage(item)}
                  className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-amber-500/50 transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-zinc-950 overflow-hidden relative">
                      <img 
                        src={resolveImageUrl(item.url)} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {/* Action buttons (Edit & Delete) - Admin Only */}
                      {userSession?.role === 'admin' && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditPortfolioModal(item);
                            }}
                            className="p-2 bg-zinc-950/80 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 rounded-xl backdrop-blur-md border border-amber-500/30 transition shadow-md"
                            title="Edit Photo Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPortfolioToDelete(item);
                            }}
                            className="p-2 bg-zinc-950/80 hover:bg-rose-600 hover:text-white text-rose-400 rounded-xl backdrop-blur-md border border-rose-500/30 transition shadow-md"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">{item.title}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      )}

      {/* PAGE 3: SERVICES PAGE */}
      {activeTab === "services" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* Breadcrumb & Header */}
          <div className="space-y-3 border-b border-zinc-800 pb-8">
            <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <button onClick={() => navigateToPage("home")} className="hover:text-amber-400">Home</button>
              <span>/</span>
              <span className="text-amber-400 font-bold">Services & Offerings</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Cinematography & Photography Services</h1>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Comprehensive photography, 4K cinematography, drone visuals, and digital album editing tailored to your events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((srv, idx) => (
              <div 
                key={idx}
                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-6 space-y-4 flex flex-col justify-between transition group"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                    {srv.category === 'Cinematography' ? <Video className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">{srv.category}</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition">{srv.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{srv.description}</p>

                  {srv.details && (
                    <ul className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                      {srv.details.map((d, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={() => handleInquireService(srv.title)}
                  className="w-full mt-4 py-3 bg-zinc-950 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 font-bold text-xs rounded-xl border border-zinc-800 transition text-center"
                >
                  Book Service Inquiry
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* PAGE 4: CLIENT PORTAL / PROOFING PAGE */}
      {activeTab === "proofing" && (
        <main className="py-8">
          {/* If Logged in as Admin */}
          {userSession && userSession.role === "admin" ? (
            <AdminDashboard 
              session={userSession}
              projects={proofingProjects}
              onUpdateProjects={(updated) => setProofingProjects(updated)}
              inquiries={eventInquiries}
              onUpdateInquiries={(updatedInq) => setEventInquiries(updatedInq)}
              portfolio={portfolio}
              onUpdatePortfolio={(updatedPort) => setPortfolio(updatedPort)}
              onOpenAddPortfolioModal={handleOpenAddPortfolioModal}
              onOpenEditPortfolioModal={handleOpenEditPortfolioModal}
              onOpenDeletePortfolioModal={(item) => setPortfolioToDelete(item)}
              onOpenEditAboutModal={() => setShowEditAboutModal(true)}
              onLogout={handleLogout}
            />
          ) : userSession && userSession.role === "client" && assignedClientProject ? (
            /* If Logged in as Client */
            <ClientPortal 
              session={userSession}
              project={assignedClientProject}
              onUpdateProject={(updatedProj) => {
                const updatedList = proofingProjects.map(p => p.id === updatedProj.id ? updatedProj : p);
                setProofingProjects(updatedList);
              }}
              onLogout={handleLogout}
            />
          ) : (
            /* If Not Logged In, show Login Welcome & Modal CTA */
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-center">
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
                  <button onClick={() => navigateToPage("home")} className="hover:text-amber-400">Home</button>
                  <span>/</span>
                  <span className="text-amber-400 font-bold">Login</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Studio Access & Client Proofing</h1>
                <p className="text-zinc-400 text-sm max-w-xl mx-auto">
                  Sign in to access your private event photographs, watch your 4K cinematic wedding videos, and select your favorite album spreads.
                </p>
              </div>

              <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md mx-auto space-y-6 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                  <Lock className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">Login</h3>
                  <p className="text-xs text-zinc-400 mt-1">Sign in with Google, Mobile OTP, or Passcode</p>
                </div>

                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
                >
                  Open Login
                </button>

                <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Protected by Studio Privacy & Passcode Authentication</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* PAGE 5: ABOUT PAGE */}
      {activeTab === "about" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Breadcrumb & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <button onClick={() => navigateToPage("home")} className="hover:text-amber-400">Home</button>
                <span>/</span>
                <span className="text-amber-400 font-bold">About Studio</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">About {personalInfo.name}</h1>
              <p className="text-zinc-400 text-sm max-w-2xl">
                {personalInfo.title}
              </p>
            </div>

            {userSession?.role === 'admin' && (
              <button
                onClick={() => setShowEditAboutModal(true)}
                className="self-start sm:self-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Studio Details & Bio</span>
              </button>
            )}
          </div>

          {/* About Bio Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group">
              <img 
                src={resolveImageUrl(personalInfo.aboutImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80")} 
                alt={personalInfo.name} 
                className="w-full aspect-[3/4] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              
              {userSession?.role === 'admin' && (
                <button
                  onClick={() => setShowEditAboutModal(true)}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-zinc-950/80 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 font-bold text-xs rounded-xl backdrop-blur-md border border-amber-500/30 transition shadow-lg flex items-center gap-1.5 z-10"
                  title="Change Founder Image"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Change Image</span>
                </button>
              )}

              <div className="absolute bottom-4 left-4 right-4 text-center">
                <div className="font-bold text-white text-lg">{personalInfo.name}</div>
                <div className="text-xs text-amber-400 font-mono">Founder & Creative Director</div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-white">Mastering Light, Composition & Emotional Storytelling</h2>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {personalInfo.aboutLong}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {personalInfo.highlights.map((hl, i) => (
                  <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="text-xs text-zinc-400">{hl.label}</div>
                    <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">{hl.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Awards Section */}
          <div className="space-y-6 pt-6 border-t border-zinc-800">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              <span>National & International Distinctions</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AWARDS.map((award, i) => (
                <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                    {award.authority}
                  </span>
                  <h3 className="text-lg font-bold text-white">{award.title}</h3>
                  <div className="text-xs font-semibold text-zinc-300">{award.subtitle}</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{award.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* PAGE 6: CONTACT PAGE */}
      {activeTab === "contact" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12" id="contact-section">
          {/* Breadcrumb & Header */}
          <div className="space-y-3 border-b border-zinc-800 pb-8">
            <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <button onClick={() => navigateToPage("home")} className="hover:text-amber-400">Home</button>
              <span>/</span>
              <span className="text-amber-400 font-bold">Contact Studio</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Get in Touch with GK Digital Studios</h1>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Direct booking inquiries, wedding dates availability, commercial shoot consultations, and studio inquiries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Direct Contact Cards */}
            <div className="space-y-6">
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white">Direct Studio Contacts</h3>

                <a 
                  href="tel:9491800783" 
                  className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 rounded-xl transition group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Mobile Number</div>
                    <div className="text-sm font-bold text-white group-hover:text-amber-400 font-mono">+91 9491800783</div>
                  </div>
                </a>

                <a 
                  href="mailto:gkdigitalstudios@gmail.com" 
                  className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 rounded-xl transition group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Official Email</div>
                    <div className="text-sm font-bold text-white group-hover:text-amber-400 font-mono">gkdigitalstudios@gmail.com</div>
                  </div>
                </a>

                <a 
                  href="https://wa.me/919491800783" 
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 rounded-xl transition group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-300 font-semibold">Instant WhatsApp Chat</div>
                    <div className="text-sm font-bold text-white font-mono">+91 9491800783</div>
                  </div>
                </a>

                <a 
                  href={personalInfo.instagram} 
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-950/40 via-pink-950/40 to-amber-950/40 border border-pink-500/40 hover:border-pink-400 rounded-xl transition group"
                >
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-pink-300 font-semibold flex items-center gap-1">
                      Official Instagram <ExternalLink className="w-3 h-3 text-pink-400" />
                    </div>
                    <div className="text-sm font-bold text-white font-mono">@gk_digital_studios</div>
                  </div>
                </a>

                <a 
                  href={personalInfo.googleMaps} 
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-sky-500/10 border border-sky-500/30 hover:border-sky-400 rounded-xl transition group"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-sky-300 font-semibold flex items-center gap-1">
                      Google Maps Location <ExternalLink className="w-3 h-3 text-sky-400" />
                    </div>
                    <div className="text-sm font-bold text-white">View GK Digital Studios</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-white">Send Event Inquiry</h3>

              {contactSuccess ? (
                <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-extrabold text-white">Inquiry Saved & Sent to Admin!</h4>
                    <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                      Thank you <strong className="text-amber-400">{contactForm.name}</strong>! Your event inquiry details have been transmitted to <strong className="text-white">Govind Kumar Gella (GK Digital Studios)</strong> and logged in the studio admin system.
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 max-w-md mx-auto text-left space-y-1.5 font-mono text-xs text-zinc-300">
                    <div><span className="text-zinc-500">Service:</span> <strong className="text-amber-400">{contactForm.service}</strong></div>
                    <div><span className="text-zinc-500">Phone:</span> {contactForm.phone}</div>
                    <div><span className="text-zinc-500">Email:</span> {contactForm.email || 'N/A'}</div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={`https://wa.me/919491800783?text=${encodeURIComponent(
                        `Hello *GK Digital Studios*! 👋\n\nI would like to submit an *Event Booking Inquiry* with the following details:\n\n👤 *Full Name:* ${contactForm.name}\n📞 *Phone:* ${contactForm.phone}\n✉️ *Email:* ${contactForm.email || 'N/A'}\n📷 *Service:* ${contactForm.service}\n\n📝 *Message:*\n"${contactForm.message}"`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Open WhatsApp Chat Directly</span>
                    </a>

                    <button
                      onClick={() => {
                        setContactSuccess(false);
                        setContactForm({ name: "", email: "", phone: "", service: "Wedding Photography", message: "" });
                      }}
                      className="w-full sm:w-auto px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition border border-zinc-700"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form 
                  onSubmit={handleSendInquiry} 
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Your Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Rajesh Varma"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Your Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="9491800783"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="gkdigitalstudios@gmail.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Service Requested</label>
                      <select
                        value={contactForm.service}
                        onChange={(e) => setContactForm({ ...contactForm, service: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Wedding Photography">Wedding Photography</option>
                        <option value="Cinematic Wedding Films">Cinematic Wedding Films</option>
                        <option value="Pre-Wedding Shoot">Pre-Wedding Shoot</option>
                        <option value="Portrait Photography">Portrait Photography</option>
                        <option value="Drone Aerial Visuals">Drone Aerial Visuals</option>
                        <option value="Album Designing & Editing">Album Designing & Editing</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Event Details / Message</label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="Tell us about your event date, location, and specific requirements..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <span>Submit Booking Inquiry & Open WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-zinc-500 text-center italic">
                    ⚡ Automatically saves inquiry to studio admin records & redirects to WhatsApp (+91 9491800783).
                  </p>
                </form>
              )}
            </div>
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="font-bold text-white text-base">GK DIGITAL STUDIOS</div>
            <p className="text-zinc-400">Govind Kumar Gella • Official Studio Website</p>
            <p className="text-zinc-500">Phone: +91 9491800783 | Email: gkdigitalstudios@gmail.com</p>
            
            {/* Social Links */}
            <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
              <a 
                href={personalInfo.instagram} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-lg text-xs font-semibold transition"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram</span>
              </a>

              <a 
                href={personalInfo.googleMaps} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <button onClick={() => navigateToPage("home")} className="hover:text-amber-400">Home</button>
            <button onClick={() => navigateToPage("portfolio")} className="hover:text-amber-400">Galleries</button>
            <button onClick={() => navigateToPage("services")} className="hover:text-amber-400">Services</button>
            <button onClick={() => navigateToPage("about")} className="hover:text-amber-400">About</button>
            <button onClick={() => navigateToPage("contact")} className="hover:text-amber-400">Contact</button>
          </div>

          <div className="text-zinc-500 text-center md:text-right">
            © {new Date().getFullYear()} GK Digital Studios. All rights reserved.
          </div>
        </div>
      </footer>

      {/* LIGHTBOX MODAL */}
      {activeLightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prominent, easily visible close button at top right */}
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white rounded-xl border border-zinc-700 transition flex items-center gap-1.5 text-xs font-bold z-30 shadow-lg"
              title="Close Image Preview"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Close</span>
            </button>

            {/* Reduced image max-height so image & info fit comfortably without covering controls */}
            <div className="w-full flex justify-center items-center my-2 pt-2">
              <img 
                src={resolveImageUrl(activeLightboxImage.url)} 
                alt={activeLightboxImage.title} 
                className="max-h-[55vh] sm:max-h-[60vh] md:max-h-[65vh] w-auto max-w-full object-contain rounded-xl border border-zinc-800 shadow-2xl"
              />
            </div>

            <div className="mt-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 inline-block">
                {activeLightboxImage.category}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">{activeLightboxImage.title}</h3>
              {activeLightboxImage.description && (
                <p className="text-xs text-zinc-400 max-w-lg mx-auto">{activeLightboxImage.description}</p>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setActiveLightboxImage(null)}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold rounded-xl border border-zinc-700 transition shadow-md"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICATION LOGIN MODAL */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        projects={proofingProjects}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* PORTFOLIO ADD / EDIT MODAL */}
      <PortfolioModal 
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        onSave={handleSavePortfolioItem}
        editingItem={editingPortfolioItem}
      />

      {/* PORTFOLIO DELETE CONFIRMATION MODAL */}
      <DeletePortfolioModal 
        item={portfolioToDelete}
        onClose={() => setPortfolioToDelete(null)}
        onConfirmDelete={handleConfirmDeletePortfolio}
      />

      {/* EDIT ABOUT & STUDIO DETAILS MODAL (ADMIN ONLY) */}
      <EditAboutModal 
        isOpen={showEditAboutModal}
        onClose={() => setShowEditAboutModal(false)}
        personalInfo={personalInfo}
        onSave={(updatedInfo) => setPersonalInfo(updatedInfo)}
      />

    </div>
  );
}
