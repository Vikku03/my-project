import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  CheckCircle2, 
  User, 
  Phone, 
  Calendar, 
  KeyRound, 
  Sparkles, 
  Edit, 
  Download, 
  Search, 
  Eye, 
  LogOut, 
  ShieldCheck,
  FileText,
  ExternalLink,
  Save,
  Clock,
  Upload,
  Link as LinkIcon,
  X,
  FileCheck,
  Film,
  FileImage,
  Layers,
  MessageSquare,
  Copy,
  Check,
  Filter,
  Heart,
  FolderPlus,
  Mail,
  Send,
  Inbox,
  Cloud,
  UploadCloud,
  Server,
  Database,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { ProofProject, ProofImage, ProofVideo, InquiryItem, PortfolioItem, UserSession } from '../types';
import { checkS3Status, uploadFileToAWS, deleteFileFromAWS, saveUsersToAWS, S3Status } from '../lib/aws';
import { detectFormat, getEmbedVideoUrl, generateVideoThumbnail, resolveImageUrl } from '../utils/media';

interface AdminDashboardProps {
  session?: UserSession | null;
  projects: ProofProject[];
  onUpdateProjects: (updated: ProofProject[]) => void;
  inquiries?: InquiryItem[];
  onUpdateInquiries?: (updated: InquiryItem[]) => void;
  portfolio?: PortfolioItem[];
  onUpdatePortfolio?: (updated: PortfolioItem[]) => void;
  onOpenAddPortfolioModal?: () => void;
  onOpenEditPortfolioModal?: (item: PortfolioItem) => void;
  onOpenDeletePortfolioModal?: (item: PortfolioItem) => void;
  onOpenEditAboutModal?: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  projects,
  onUpdateProjects,
  inquiries = [],
  onUpdateInquiries,
  portfolio = [],
  onUpdatePortfolio,
  onOpenAddPortfolioModal,
  onOpenEditPortfolioModal,
  onOpenDeletePortfolioModal,
  onOpenEditAboutModal,
  onLogout,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'galleries' | 'inquiries' | 'portfolio'>('galleries');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProofProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProofProject | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<InquiryItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<ProofVideo | null>(null);

  // AWS S3 Cloud Storage & Batch Upload States
  const [s3Status, setS3Status] = useState<S3Status | null>(null);
  const [showAwsModal, setShowAwsModal] = useState(false);
  const [isUploadingToAws, setIsUploadingToAws] = useState(false);
  const [awsUploadProgress, setAwsUploadProgress] = useState(0);
  const [batchQueue, setBatchQueue] = useState<{ id: string; filename: string; sizeFormatted: string; status: 'queued' | 'uploading' | 'completed' | 'error'; progress: number }[]>([]);
  const [batchTotalCount, setBatchTotalCount] = useState(0);
  const [batchCompletedCount, setBatchCompletedCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentUploadingFile, setCurrentUploadingFile] = useState('');

  useEffect(() => {
    checkS3Status().then(setS3Status).catch(() => {});
  }, []);

  // Portfolio Admin Filter & Search States
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioCategoryFilter, setPortfolioCategoryFilter] = useState<string>('All');

  const filteredAdminPortfolio = portfolio.filter(item => {
    const q = portfolioSearch.toLowerCase().trim();
    const matchesCategory = portfolioCategoryFilter === 'All' || item.category === portfolioCategoryFilter;
    const matchesSearch = !q || (item.title || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Inquiry Filter & Search States
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'all' | 'new' | 'contacted' | 'confirmed' | 'closed'>('all');
  const [copiedInquiriesReport, setCopiedInquiriesReport] = useState(false);

  // Inquiry Handlers
  const handleUpdateInquiryStatus = (inqId: string, newStatus: 'new' | 'contacted' | 'confirmed' | 'closed') => {
    if (!onUpdateInquiries) return;
    const updated = inquiries.map(inq => inq.id === inqId ? { ...inq, status: newStatus } : inq);
    onUpdateInquiries(updated);
  };

  const confirmDeleteInquiry = (inqId: string) => {
    if (onUpdateInquiries) {
      const updated = inquiries.filter(inq => inq.id !== inqId);
      onUpdateInquiries(updated);
    }
    setInquiryToDelete(null);
  };

  const handleCopyInquiriesReport = () => {
    if (inquiries.length === 0) return;
    let text = `======================================\n`;
    text += `GK DIGITAL STUDIOS - CLIENT EVENT INQUIRIES REPORT\n`;
    text += `Total Inquiries: ${inquiries.length}\n`;
    text += `Generated On: ${new Date().toLocaleString()}\n`;
    text += `======================================\n\n`;

    inquiries.forEach((inq, idx) => {
      text += `${idx + 1}. [${inq.status.toUpperCase()}] ${inq.name} (${inq.phone})\n`;
      text += `   Service: ${inq.service} | Email: ${inq.email}\n`;
      text += `   Submitted: ${inq.submittedAt}\n`;
      text += `   Message: "${inq.message}"\n\n`;
    });

    try {
      navigator.clipboard.writeText(text);
      setCopiedInquiriesReport(true);
      setTimeout(() => setCopiedInquiriesReport(false), 2000);
    } catch (e) {
      console.warn('Could not copy report:', e);
    }
  };
  
  // Unified Direct Media Upload State
  const [showAddMediaModal, setShowAddMediaModal] = useState<boolean>(false);
  const [selectedFormatCategory, setSelectedFormatCategory] = useState<string>('AUTO');
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  const [mediaTitleInput, setMediaTitleInput] = useState<string>('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');

  // New Project Form State
  const [newProject, setNewProject] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    passcode: '',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    category: 'Weddings',
    description: ''
  });

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length;

  const filteredInquiries = inquiries.filter(inq => {
    const q = inquirySearch.toLowerCase().trim();
    const matchesSearch = !q || 
      inq.name.toLowerCase().includes(q) ||
      inq.phone.includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      inq.service.toLowerCase().includes(q) ||
      inq.message.toLowerCase().includes(q);

    const matchesStatus = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Gallery Filter & Review Report State
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'selected' | 'reviewed'>('all');
  const [copiedReviewList, setCopiedReviewList] = useState<boolean>(false);

  // Copy Client Selection & Review Report
  const handleCopyReviewList = () => {
    if (!activeProject) return;
    const selectedImgs = (activeProject.images || []).filter(i => i?.selected);
    const reviewedImgs = (activeProject.images || []).filter(i => i?.comment && i.comment.trim().length > 0);

    let text = `======================================\n`;
    text += `GK DIGITAL STUDIOS - CLIENT REVIEW REPORT\n`;
    text += `Client: ${activeProject.clientName}\n`;
    text += `Category: ${activeProject.category} | Event Date: ${activeProject.date}\n`;
    text += `Status: ${activeProject.status.toUpperCase()}\n`;
    if (activeProject.submittedAt) text += `Submitted On: ${activeProject.submittedAt}\n`;
    text += `======================================\n\n`;

    text += `SPECIAL ALBUM INSTRUCTIONS / NOTES:\n`;
    text += `${activeProject.selectionNotes || 'None provided'}\n\n`;

    text += `SELECTED PHOTOS FOR ALBUM (${selectedImgs.length}):\n`;
    if (selectedImgs.length === 0) {
      text += `(No photos marked selected yet)\n`;
    } else {
      selectedImgs.forEach((img, idx) => {
        text += `${idx + 1}. ${img.title}${img.comment ? ` - Note: "${img.comment}"` : ''}\n`;
      });
    }

    if (reviewedImgs.length > 0) {
      text += `\nINDIVIDUAL PHOTO RETOUCHING NOTES (${reviewedImgs.length}):\n`;
      reviewedImgs.forEach((img, idx) => {
        text += `${idx + 1}. ${img.title}: "${img.comment}" (Selected: ${img.selected ? 'Yes' : 'No'})\n`;
      });
    }

    try {
      navigator.clipboard.writeText(text);
      setCopiedReviewList(true);
      setTimeout(() => setCopiedReviewList(false), 2000);
    } catch (e) {
      console.warn('Could not copy review list to clipboard:', e);
    }
  };

  // Open Media Modal
  const handleOpenAddMedia = () => {
    setSelectedFormatCategory('AUTO');
    setMediaUrlInput('');
    setMediaTitleInput('');
    setUploadSuccessMessage('');
    setShowAddMediaModal(true);
  };

  // High-Performance Batch Multi-File Upload Engine (Supports 1, 10, 50, 100+ files concurrently)
  const processBatchFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0 || !activeProject) return;

    const filesArray = Array.from(fileList);
    const totalFiles = filesArray.length;

    setIsUploadingToAws(true);
    setBatchTotalCount(totalFiles);
    setBatchCompletedCount(0);
    setAwsUploadProgress(0);

    const initialQueue = filesArray.map((f, i) => ({
      id: `q-${i}-${Date.now()}`,
      filename: f.name,
      sizeFormatted: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: 'queued' as const,
      progress: 0
    }));
    setBatchQueue(initialQueue);

    const folderName = `gk-media/${activeProject.clientName.replace(/\s+/g, '_')}`;
    const newImages: ProofImage[] = [];
    const newVideos: ProofVideo[] = [];
    let overallMode = 'local_fallback';
    let completedCounter = 0;

    // Parallel Worker Pool (Concurrency of 5 files simultaneously)
    const CONCURRENCY_LIMIT = 5;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < filesArray.length) {
        const idx = currentIndex++;
        const file = filesArray[idx];

        setCurrentUploadingFile(file.name);
        setBatchQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'uploading', progress: 25 } : q));

        try {
          const uploadRes = await uploadFileToAWS(file, folderName);
          if (uploadRes.mode === 's3') overallMode = 's3';

          const extName = file.name.split('.').pop()?.toLowerCase() || '';
          const isVideoFile = file.type.startsWith('video/') || 
            ['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v', '3gp', 'flv', 'ogv'].includes(extName);

          const isExplicitVideo = selectedFormatCategory === 'VIDEO' || selectedFormatCategory === 'EMBED';
          const isExplicitPhoto = selectedFormatCategory === 'PHOTO';
          
          const treatAsVideo = isExplicitVideo || (!isExplicitPhoto && isVideoFile);
          const extFormat = detectFormat(file.name, treatAsVideo);
          const title = file.name.replace(/\.[^/.]+$/, '');
          const mediaUrl = uploadRes.url || URL.createObjectURL(file);

          if (treatAsVideo) {
            let thumb = '';
            try {
              thumb = await generateVideoThumbnail(mediaUrl);
            } catch (err) {
              console.warn('Could not extract video thumbnail canvas:', err);
            }

            newVideos.push({
              id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              title: title,
              videoUrl: mediaUrl,
              thumbnailUrl: thumb,
              duration: uploadRes.mode === 's3' ? 'AWS S3 4K Cloud' : 'Cloud Video',
              description: `Stored in AWS S3 (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
              format: extFormat
            });
          } else {
            newImages.push({
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              url: mediaUrl,
              title: title,
              selected: false,
              comment: '',
              format: extFormat
            });
          }

          setBatchQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'completed', progress: 100 } : q));
        } catch (err) {
          console.error(`Batch upload error for ${file.name}:`, err);
          setBatchQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'error', progress: 0 } : q));
        } finally {
          completedCounter++;
          setBatchCompletedCount(completedCounter);
          setAwsUploadProgress(Math.round((completedCounter / totalFiles) * 100));
        }
      }
    };

    const workerTasks = [];
    for (let w = 0; w < Math.min(CONCURRENCY_LIMIT, filesArray.length); w++) {
      workerTasks.push(worker());
    }

    await Promise.all(workerTasks);

    // Commit all newly uploaded photos & videos to state
    const updatedProjects = projects.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          images: [...(p.images || []), ...newImages],
          videos: [...(p.videos || []), ...newVideos]
        };
      }
      return p;
    });
    onUpdateProjects(updatedProjects);

    setIsUploadingToAws(false);
    setAwsUploadProgress(100);
    const storageTag = overallMode === 's3' ? 'AWS S3 Cloud Storage' : 'Cloud Storage';
    setUploadSuccessMessage(`Successfully uploaded ${totalFiles} file(s) (${newImages.length} photos, ${newVideos.length} videos) to ${storageTag}!`);

    setTimeout(() => {
      setShowAddMediaModal(false);
      setUploadSuccessMessage('');
      setAwsUploadProgress(0);
      setBatchQueue([]);
      setCurrentUploadingFile('');
    }, 2000);
  };

  const handleDirectFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processBatchFiles(e.target.files);
    }
  };

  // URL / Link Save Handler
  const handleSaveMediaUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrlInput.trim() || !activeProject) return;

    const url = mediaUrlInput.trim();
    const isVideoUrl = selectedFormatCategory === 'VIDEO' || selectedFormatCategory === 'EMBED' ||
      url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') ||
      /\.(mp4|mov|webm|m4v|avi|mkv)(\?.*)?$/i.test(url);

    const extFormat = detectFormat(url, isVideoUrl);
    const title = mediaTitleInput.trim() || (isVideoUrl ? `Video Film (${extFormat})` : `Photo (${extFormat})`);

    let updatedProjects: ProofProject[];

    if (isVideoUrl) {
      let thumb = '';
      const embedInfo = getEmbedVideoUrl(url);
      if (embedInfo.isDirectVideo) {
        try {
          thumb = await generateVideoThumbnail(embedInfo.url);
        } catch (e) {
          console.warn('Could not generate thumb for direct video URL:', e);
        }
      }

      const newVidItem: ProofVideo = {
        id: `vid-${Date.now()}`,
        title: title,
        videoUrl: url,
        thumbnailUrl: thumb,
        duration: 'Stream / Embed',
        description: `Linked ${extFormat} Video`,
        format: extFormat
      };
      updatedProjects = projects.map(p => {
        if (p.id === activeProject.id) {
          return { ...p, videos: [...(p.videos || []), newVidItem] };
        }
        return p;
      });
    } else {
      const newImgItem: ProofImage = {
        id: `img-${Date.now()}`,
        url: url,
        title: title,
        selected: false,
        comment: '',
        format: extFormat
      };
      updatedProjects = projects.map(p => {
        if (p.id === activeProject.id) {
          return { ...p, images: [...(p.images || []), newImgItem] };
        }
        return p;
      });
    }

    onUpdateProjects(updatedProjects);
    setUploadSuccessMessage('Media added! Directly accessible in project.');
    setTimeout(() => {
      setShowAddMediaModal(false);
      setUploadSuccessMessage('');
    }, 1000);
  };

  // Create Project (Stores all client details directly to AWS S3 Cloud Storage)
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.clientName || !newProject.passcode) return;

    const created: ProofProject = {
      id: `GK-${Date.now().toString().slice(-4)}`,
      clientName: newProject.clientName,
      clientPhone: newProject.clientPhone,
      clientEmail: newProject.clientEmail,
      passcode: newProject.passcode.toUpperCase(),
      date: newProject.date,
      category: newProject.category,
      description: newProject.description || 'Client proofing gallery for photo and video selections.',
      status: 'reviewing',
      images: [],
      videos: []
    };

    const updated = [created, ...projects];
    onUpdateProjects(updated);
    saveUsersToAWS(updated).catch(err => console.warn('AWS S3 user save warning:', err));

    setSelectedProjectId(created.id);
    setShowCreateModal(false);
    setNewProject({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      passcode: '',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      category: 'Weddings',
      description: ''
    });
  };

  // Delete Image (Removes from active project and cleans up AWS S3 storage)
  const handleDeleteImage = async (imageId: string) => {
    if (!activeProject) return;
    const targetImage = (activeProject.images || []).find(img => img.id === imageId);
    if (targetImage && targetImage.url) {
      deleteFileFromAWS(targetImage.url).catch(err => console.warn('Could not delete image from AWS S3:', err));
    }

    const updatedProjects = projects.map(p => {
      if (p.id === activeProject.id) {
        return { ...p, images: (p.images || []).filter(img => img.id !== imageId) };
      }
      return p;
    });
    onUpdateProjects(updatedProjects);
  };

  // Delete Video (Removes from active project and cleans up video film and thumbnail in AWS S3 storage)
  const handleDeleteVideo = async (videoId: string) => {
    if (!activeProject) return;
    const targetVid = (activeProject.videos || []).find(v => v.id === videoId);
    if (targetVid) {
      if (targetVid.videoUrl) {
        deleteFileFromAWS(targetVid.videoUrl).catch(err => console.warn('Could not delete video from AWS S3:', err));
      }
      if (targetVid.thumbnailUrl) {
        deleteFileFromAWS(targetVid.thumbnailUrl).catch(err => console.warn('Could not delete thumbnail from AWS S3:', err));
      }
    }

    const updatedProjects = projects.map(p => {
      if (p.id === activeProject.id) {
        return { ...p, videos: (p.videos || []).filter(v => v.id !== videoId) };
      }
      return p;
    });
    onUpdateProjects(updatedProjects);
  };

  // Delete Project Confirmation Action (Cleans up all associated S3 photos and video files)
  const confirmDeleteProject = async (projId: string) => {
    const targetProj = projects.find(p => p.id === projId);
    if (targetProj) {
      (targetProj.images || []).forEach(img => {
        if (img.url) deleteFileFromAWS(img.url).catch(e => console.warn('S3 photo delete error:', e));
      });
      (targetProj.videos || []).forEach(vid => {
        if (vid.videoUrl) deleteFileFromAWS(vid.videoUrl).catch(e => console.warn('S3 video delete error:', e));
        if (vid.thumbnailUrl) deleteFileFromAWS(vid.thumbnailUrl).catch(e => console.warn('S3 thumbnail delete error:', e));
      });
    }

    const updated = projects.filter(p => p.id !== projId);
    onUpdateProjects(updated);
    if (selectedProjectId === projId) {
      setSelectedProjectId(updated[0]?.id || '');
    }
    setProjectToDelete(null);
  };

  // Change Status
  const handleStatusChange = (status: 'reviewing' | 'submitted' | 'completed') => {
    if (!activeProject) return;
    const updated = projects.map(p => p.id === activeProject.id ? { ...p, status } : p);
    onUpdateProjects(updated);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* User-Friendly Admin Ribbon Header */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative">
          
          {/* Left: Studio Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 font-mono">
                  GK Digital Studios • Control Center
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Govind Kumar Gella • Studio Admin
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage Client Proofing Galleries • Store Photos & Videos • Review Selections
              </p>
            </div>
          </div>

          {/* Right: Modern Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/80 justify-end">
            {onOpenEditAboutModal && (
              <button
                onClick={onOpenEditAboutModal}
                className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 border border-zinc-700"
                title="Edit Studio Profile, Contact Info & Founder Biography"
              >
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Edit About & Bio</span>
              </button>
            )}

            <button
              onClick={() => setShowAwsModal(true)}
              className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 font-bold px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 border border-sky-500/30"
              title="AWS S3 Cloud Storage Settings & Status"
            >
              <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
              <span>AWS S3 Cloud</span>
              <span className={`w-2 h-2 rounded-full ${s3Status?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Client Gallery</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveAdminTab('galleries')}
            className={`px-5 py-3 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
              activeAdminTab === 'galleries'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Client Proofing Galleries ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('inquiries')}
            className={`px-5 py-3 rounded-xl font-extrabold text-xs transition flex items-center gap-2 relative ${
              activeAdminTab === 'inquiries'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Client Booking Inquiries ({inquiries.length})</span>
            {newInquiriesCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white font-mono text-[10px] font-extrabold rounded-full animate-pulse">
                {newInquiriesCount} NEW
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('portfolio')}
            className={`px-5 py-3 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
              activeAdminTab === 'portfolio'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Website Portfolio Images ({portfolio.length})</span>
          </button>
        </div>

        {/* TAB 1: CLIENT PROOFING GALLERIES */}
        {activeAdminTab === 'galleries' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Client List */}
          <div className="lg:col-span-1 space-y-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Client Accounts</h2>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{projects.length} Total</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 italic">
                  No client galleries exist.
                </div>
              ) : (
                projects.map((proj) => {
                  const selectedCount = (proj.images || []).filter(i => i?.selected).length;
                  const isCurrent = proj.id === activeProject?.id;

                  return (
                    <div
                      key={proj.id}
                      className={`w-full p-3.5 rounded-xl transition border flex items-center justify-between gap-2.5 ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId(proj.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-sm truncate">{proj.clientName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase shrink-0 ${
                            proj.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                            proj.status === 'submitted' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {proj.status}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-zinc-400 flex items-center gap-2 font-mono">
                          <span>Key: <strong className="text-amber-400">{proj.passcode}</strong></span>
                          <span>•</span>
                          <span>{(proj.images || []).length} Photos</span>
                        </div>

                        <div className="mt-1 text-[11px] text-zinc-500 flex items-center justify-between gap-1">
                          <span className="truncate">Phone: {proj.clientPhone || 'N/A'}</span>
                          <span className="text-emerald-400 font-medium shrink-0">{selectedCount} Selected</span>
                        </div>
                        {proj.clientEmail && (
                          <div className="text-[10px] text-sky-400 font-mono truncate mt-0.5">
                            ✉ {proj.clientEmail}
                          </div>
                        )}
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject({ ...proj });
                          }}
                          className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition border border-transparent hover:border-amber-500/30 shrink-0"
                          title={`Edit ${proj.clientName}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(proj);
                          }}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-transparent hover:border-rose-500/30 shrink-0"
                          title={`Delete ${proj.clientName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Client Project Inspector & Media Manager */}
          {!activeProject ? (
            <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl mx-auto flex items-center justify-center">
                <FolderPlus className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">No Client Galleries Selected</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  All client galleries have been removed or none exist yet. Click below to create a new client proofing account.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Client Gallery</span>
              </button>
            </div>
          ) : (
            <div className="lg:col-span-3 space-y-6">
              
              {/* Project Overview Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">{activeProject.clientName}</h2>
                      <span className="bg-zinc-800 text-amber-400 text-xs px-3 py-1 rounded-full font-mono font-semibold border border-amber-500/30">
                        Passcode: {activeProject.passcode}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{activeProject.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingProject({ ...activeProject })}
                      className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded-xl transition border border-amber-500/30 text-xs font-semibold flex items-center gap-2"
                      title="Edit Client Account Details"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Client Account</span>
                    </button>

                    <button
                      onClick={() => setProjectToDelete(activeProject)}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition border border-rose-500/30 text-xs font-semibold flex items-center gap-2"
                      title="Delete Client Project"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Client</span>
                    </button>
                  </div>
                </div>

                {/* Info Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block">Category & Date</span>
                    <span className="text-white font-semibold">{activeProject.category} • {activeProject.date}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block">Phone & Email</span>
                    <span className="text-amber-300 font-semibold block truncate">{activeProject.clientPhone || 'N/A'}</span>
                    <span className="text-sky-400 text-[11px] block truncate">{activeProject.clientEmail || 'No email set'}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block">Photos / Videos Stored</span>
                    <span className="text-white font-semibold">{activeProject.images.length} Photos • {(activeProject.videos || []).length} Videos</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block">Client Selection Status</span>
                    <span className="text-emerald-400 font-semibold">{activeProject.images.filter(i => i.selected).length} Selected</span>
                  </div>
                </div>

                {/* Status Toggle buttons */}
                <div className="flex items-center gap-2 pt-2 text-xs">
                  <span className="text-zinc-400 font-medium">Update Status:</span>
                  <button
                    onClick={() => handleStatusChange('reviewing')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition ${activeProject.status === 'reviewing' ? 'bg-blue-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300'}`}
                  >
                    In Review
                  </button>
                  <button
                    onClick={() => handleStatusChange('submitted')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition ${activeProject.status === 'submitted' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300'}`}
                  >
                    Client Submitted
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition ${activeProject.status === 'completed' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300'}`}
                  >
                    Completed & Delivered
                  </button>
                </div>
              </div>

              {/* CLIENT REVIEWS & SELECTION SUMMARY CARD */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Client Selection & Review Notes</span>
                        {activeProject.status === 'submitted' && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                            Submitted
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {activeProject.submittedAt ? `Submitted on ${activeProject.submittedAt}` : 'Client proofing choices & retouching instructions'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyReviewList}
                    className="self-start sm:self-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition border border-zinc-700 flex items-center gap-2"
                  >
                    {copiedReviewList ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                    <span>{copiedReviewList ? 'Copied Report!' : 'Copy Review Report'}</span>
                  </button>
                </div>

                {/* Special Album Instructions */}
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                    Special Album Instructions / Notes
                  </span>
                  {activeProject.selectionNotes ? (
                    <p className="text-xs text-zinc-200 leading-relaxed italic bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      "{activeProject.selectionNotes}"
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      No general album instructions submitted yet by client. Check individual photo notes below.
                    </p>
                  )}
                </div>

                {/* Filter Shortcut Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-zinc-400 font-medium mr-1">Filter Gallery View:</span>
                  <button
                    onClick={() => setGalleryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      galleryFilter === 'all'
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    All Photos ({(activeProject.images || []).length})
                  </button>
                  <button
                    onClick={() => setGalleryFilter('selected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      galleryFilter === 'selected'
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selected Only ({(activeProject.images || []).filter(i => i?.selected).length})</span>
                  </button>
                  <button
                    onClick={() => setGalleryFilter('reviewed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      galleryFilter === 'reviewed'
                        ? 'bg-amber-400 text-zinc-950 font-bold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>With Client Notes ({(activeProject.images || []).filter(i => i?.comment && i.comment.trim()).length})</span>
                  </button>
                </div>
              </div>

              {/* Media Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    Stored Media Files for {activeProject.clientName}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Supports all formats: JPEG, PNG, WEBP, HEIC, RAW (CR2/NEF), MP4, MOV, WEBM, YouTube, Vimeo, Drive
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddMedia}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Media Files</span>
                  </button>
                </div>
              </div>

              {/* Stored Videos Section */}
              {(activeProject.videos && activeProject.videos.length > 0) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <VideoIcon className="w-4 h-4 text-amber-400" />
                    Cinematic Video Films ({activeProject.videos.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeProject.videos.map((vid) => {
                      const fmt = vid.format || detectFormat(vid.videoUrl, true);
                      const embedInfo = getEmbedVideoUrl(vid.videoUrl);
                      return (
                        <div key={vid.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 relative group hover:border-zinc-700 transition">
                          <div className="w-full sm:w-44 aspect-video rounded-lg overflow-hidden bg-black border border-zinc-800 shrink-0 relative">
                            {embedInfo.isDirectVideo ? (
                              <video 
                                key={embedInfo.url}
                                src={embedInfo.url}
                                controls
                                playsInline
                                preload="metadata"
                                poster={vid.thumbnailUrl || undefined}
                                className="w-full h-full object-contain bg-black" 
                              >
                                <source src={embedInfo.url} />
                              </video>
                            ) : (
                              <iframe 
                                src={embedInfo.url} 
                                title={vid.title}
                                className="w-full h-full border-0"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="font-semibold text-sm text-white truncate pr-6">{vid.title}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-amber-400 font-mono">{vid.duration}</span>
                                <span className="text-[10px] font-mono text-amber-300 uppercase bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                  .{fmt}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 line-clamp-2 mt-1">{vid.description}</div>
                            </div>

                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-800/80">
                              <button
                                type="button"
                                onClick={() => setPreviewVideo(vid)}
                                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Play Fullscreen Film</span>
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteVideo(vid.id)}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition z-10"
                            title="Delete Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stored Photos Grid */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>
                      Photo Gallery ({
                        (activeProject.images || []).filter(img => {
                          if (galleryFilter === 'selected') return img?.selected;
                          if (galleryFilter === 'reviewed') return img?.comment && img.comment.trim().length > 0;
                          return true;
                        }).length
                      } / {(activeProject.images || []).length})
                    </span>
                  </h4>

                  <span className="text-emerald-400 text-xs font-mono font-medium">
                    {(activeProject.images || []).filter(i => i?.selected).length} Marked Selected by Client
                  </span>
                </div>

                {(() => {
                  const displayImages = (activeProject.images || []).filter(img => {
                    if (galleryFilter === 'selected') return img?.selected;
                    if (galleryFilter === 'reviewed') return img?.comment && img.comment.trim().length > 0;
                    return true;
                  });

                  if (displayImages.length === 0) {
                    return (
                      <div className="p-10 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-3">
                        <ImageIcon className="w-10 h-10 text-amber-500/50 mx-auto" />
                        <h5 className="text-base font-bold text-white">
                          {galleryFilter === 'all' ? `No Media Uploaded for ${activeProject.clientName}` : 'No photos match this filter'}
                        </h5>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                          {galleryFilter === 'selected' ? 'The client has not selected any photos yet.' :
                           galleryFilter === 'reviewed' ? 'No custom retouching comments have been written by the client.' :
                           'Upload photos and video links directly to this client gallery for proofing and selection.'}
                        </p>
                        <div className="flex justify-center gap-3 pt-2">
                          {galleryFilter !== 'all' ? (
                            <button
                              onClick={() => setGalleryFilter('all')}
                              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-xl transition font-medium"
                            >
                              Show All Photos
                            </button>
                          ) : (
                            <button
                              onClick={handleOpenAddMedia}
                              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/10"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Upload Photos & Videos</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {displayImages.map((img) => {
                        const fmt = img.format || detectFormat(img.url, false);
                        return (
                          <div 
                            key={img.id} 
                            className={`relative group bg-zinc-900 border rounded-xl overflow-hidden flex flex-col transition ${
                              img.selected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-zinc-800'
                            }`}
                          >
                            <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
                              <img 
                                src={resolveImageUrl(img.url)} 
                                alt={img.title} 
                                className="w-full h-full object-cover"
                              />

                              {/* Format Badge */}
                              <div className="absolute top-2 left-2 bg-zinc-950/80 text-amber-300 font-mono text-[9px] uppercase px-2 py-0.5 rounded border border-amber-500/30">
                                .{fmt}
                              </div>

                              {/* Selected Badge */}
                              {img.selected && (
                                <div className="absolute top-8 left-2 bg-emerald-500 text-zinc-950 font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                                </div>
                              )}

                              {/* Delete Action */}
                              <button
                                onClick={() => handleDeleteImage(img.id)}
                                className="absolute top-2 right-2 p-1.5 bg-zinc-950/80 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                              <div className="text-xs font-semibold text-white truncate">{img.title}</div>
                              
                              {img.comment ? (
                                <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-lg space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-amber-400" /> Client Review Note:
                                  </span>
                                  <p className="text-xs text-zinc-100 font-medium whitespace-pre-wrap leading-relaxed">
                                    "{img.comment}"
                                  </p>
                                </div>
                              ) : (
                                <div className="text-[10px] text-zinc-500 italic">No custom retouching note</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

        </div>
        )}

        {/* TAB 2: CLIENT BOOKING INQUIRIES (TABULAR VIEW) */}
        {activeAdminTab === 'inquiries' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Stat Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">{inquiries.length}</div>
                  <div className="text-xs text-zinc-400 font-medium">Total Inquiries</div>
                </div>
              </div>

              <div className="p-5 bg-zinc-900 border border-amber-500/40 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-amber-400">{newInquiriesCount}</div>
                  <div className="text-xs text-amber-300 font-semibold">New Pending Inquiries</div>
                </div>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">
                    {inquiries.filter(i => i.status === 'contacted').length}
                  </div>
                  <div className="text-xs text-zinc-400 font-medium">In Contact</div>
                </div>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {inquiries.filter(i => i.status === 'confirmed').length}
                  </div>
                  <div className="text-xs text-zinc-400 font-medium">Confirmed Bookings</div>
                </div>
              </div>
            </div>

            {/* Filters & Actions Control Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search client, phone, email, service..."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'new', 'contacted', 'confirmed', 'closed'] as const).map((statusKey) => (
                    <button
                      key={statusKey}
                      onClick={() => setInquiryStatusFilter(statusKey)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                        inquiryStatusFilter === statusKey
                          ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-md'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {statusKey}
                    </button>
                  ))}
                </div>

                {/* Export Report */}
                <button
                  onClick={handleCopyInquiriesReport}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition border border-zinc-700 flex items-center gap-2 shrink-0"
                >
                  {copiedInquiriesReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{copiedInquiriesReport ? 'Copied Report!' : 'Export Report'}</span>
                </button>
              </div>
            </div>

            {/* TABULAR VIEW OF INQUIRIES */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Inbox className="w-4 h-4 text-amber-400" />
                  <span>Client Booking Inquiries Table</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Showing {filteredInquiries.length} of {inquiries.length} entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-mono text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-4 px-4">Received On</th>
                      <th className="py-4 px-4">Client Name & Contacts</th>
                      <th className="py-4 px-4">Service Requested</th>
                      <th className="py-4 px-4 max-w-xs sm:max-w-md">Event Details / Message</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-200">
                    {filteredInquiries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500 italic">
                          No event inquiries match the active search or status filter.
                        </td>
                      </tr>
                    ) : (
                      filteredInquiries.map((inq) => {
                        const cleanPhone = inq.phone.replace(/[^0-9]/g, '');
                        const waReplyMsg = `Hi ${inq.name}! Thank you for your inquiry about ${inq.service} with GK Digital Studios. We would love to discuss your event details!`;

                        return (
                          <tr key={inq.id} className="hover:bg-zinc-800/40 transition group">
                            {/* Date & ID */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-mono text-zinc-200 font-bold">{inq.submittedAt}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{inq.id}</div>
                            </td>

                            {/* Client Contacts */}
                            <td className="py-4 px-4 align-top space-y-1">
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-amber-400" />
                                <span>{inq.name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-zinc-300 font-mono text-[11px]">
                                <a href={`tel:${inq.phone}`} className="hover:text-amber-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-zinc-500" /> {inq.phone}
                                </a>
                              </div>
                              {inq.email && inq.email !== 'N/A' && (
                                <div className="text-zinc-400 font-mono text-[11px]">
                                  <a href={`mailto:${inq.email}`} className="hover:text-amber-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-zinc-500" /> {inq.email}
                                  </a>
                                </div>
                              )}
                            </td>

                            {/* Service Badge */}
                            <td className="py-4 px-4 align-top">
                              <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-300 font-semibold text-xs rounded-lg border border-amber-500/30 whitespace-nowrap">
                                {inq.service}
                              </span>
                            </td>

                            {/* Message / Details */}
                            <td className="py-4 px-4 align-top max-w-xs sm:max-w-md">
                              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap italic">
                                "{inq.message}"
                              </div>
                            </td>

                            {/* Interactive Status Selector */}
                            <td className="py-4 px-4 align-top">
                              <select
                                value={inq.status}
                                onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase focus:outline-none border transition cursor-pointer ${
                                  inq.status === 'new' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                  inq.status === 'contacted' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                                  inq.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                  'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}
                              >
                                <option value="new" className="bg-zinc-900 text-amber-300">NEW</option>
                                <option value="contacted" className="bg-zinc-900 text-blue-300">CONTACTED</option>
                                <option value="confirmed" className="bg-zinc-900 text-emerald-300">CONFIRMED</option>
                                <option value="closed" className="bg-zinc-900 text-zinc-400">CLOSED</option>
                              </select>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 align-top text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`https://wa.me/91${cleanPhone || '9491800783'}?text=${encodeURIComponent(waReplyMsg)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shrink-0"
                                  title="Reply to client via WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </a>

                                <button
                                  onClick={() => setInquiryToDelete(inq)}
                                  className="p-1.5 bg-zinc-800 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg transition border border-zinc-700"
                                  title="Delete Inquiry Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEBSITE PORTFOLIO MANAGER */}
        {activeAdminTab === 'portfolio' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Action Header */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  Main Website Portfolio Manager
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Add, edit, or delete images that appear on the public website galleries and homepage showcase.
                </p>
              </div>

              <button
                onClick={onOpenAddPortfolioModal}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Website Image</span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['All', 'Weddings', 'Pre-Weddings', 'Portraits', 'Events', 'Drone', 'Commercial', 'AI Creations'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPortfolioCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      portfolioCategoryFilter === cat
                        ? 'bg-amber-500 text-zinc-950 font-extrabold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search portfolio..."
                  value={portfolioSearch}
                  onChange={(e) => setPortfolioSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Portfolio Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAdminPortfolio.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                  <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No Portfolio Images Found</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    No website images match your search or category filter. Try clearing the filter or add a new photo.
                  </p>
                  <button
                    onClick={onOpenAddPortfolioModal}
                    className="px-4 py-2.5 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Image Now</span>
                  </button>
                </div>
              ) : (
                filteredAdminPortfolio.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-zinc-950 relative overflow-hidden">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">
                          {item.category}
                        </span>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition">{item.title}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 pt-0 flex items-center gap-2 border-t border-zinc-800/80 mt-2">
                      <button
                        onClick={() => onOpenEditPortfolioModal?.(item)}
                        className="flex-1 py-2 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 font-extrabold text-xs rounded-xl transition border border-zinc-700 flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>

                      <button
                        onClick={() => onOpenDeletePortfolioModal?.(item)}
                        className="py-2 px-3 bg-zinc-800 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs rounded-xl transition border border-zinc-700 flex items-center justify-center gap-1"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODAL: CREATE NEW CLIENT GALLERY */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 w-full max-w-md my-auto max-h-[90vh] flex flex-col shadow-2xl relative">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Create New Client Gallery
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 my-3 space-y-3 flex-1 text-left">
                <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-2.5 flex items-start gap-2.5 text-xs text-sky-300">
                  <Cloud className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">AWS S3 Cloud Storage</span>
                    <span>Client account details will be stored securely in AWS S3 Cloud Storage.</span>
                  </div>
                </div>

                <form id="create-client-form" onSubmit={handleCreateProject} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Client Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Vikram & Ananya"
                      value={newProject.clientName}
                      onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-amber-400 mb-1 font-semibold">Client Email Address (For Google Login)</label>
                    <input 
                      type="email" 
                      placeholder="e.g. client@gmail.com"
                      value={newProject.clientEmail}
                      onChange={(e) => setNewProject({ ...newProject, clientEmail: e.target.value })}
                      className="w-full bg-zinc-950 border border-amber-500/40 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">Client uses this email to access their private gallery via Google Login.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Client Phone Number</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="9491800783"
                      value={newProject.clientPhone}
                      onChange={(e) => setNewProject({ ...newProject, clientPhone: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Passcode (For Client Access)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. WED2026"
                      value={newProject.passcode}
                      onChange={(e) => setNewProject({ ...newProject, passcode: e.target.value.toUpperCase() })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white uppercase font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                    <select
                      value={newProject.category}
                      onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Weddings">Weddings</option>
                      <option value="Pre-Weddings">Pre-Weddings</option>
                      <option value="Portraits">Portraits</option>
                      <option value="Events">Events</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Description / Instructions</label>
                    <textarea 
                      rows={2}
                      placeholder="Select your top photos for album printing..."
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </form>
              </div>

              <div className="flex gap-2 pt-2.5 border-t border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 sm:py-2.5 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs sm:text-sm transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-client-form"
                  className="flex-1 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs sm:text-sm transition font-bold"
                >
                  Create Client Gallery
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT EXISTING CLIENT ACCOUNT */}
        {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 w-full max-w-md my-auto max-h-[90vh] flex flex-col shadow-2xl relative">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-400" />
                  Edit Client Account Details
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 my-3 space-y-3 flex-1 text-left">
                <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-2.5 flex items-start gap-2.5 text-xs text-sky-300">
                  <Cloud className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">AWS S3 Cloud Sync</span>
                    <span>Changes to this client account will automatically sync to AWS S3 Cloud Storage.</span>
                  </div>
                </div>

                <form
                  id="edit-client-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editingProject.clientName || !editingProject.passcode) return;
                    const updated = projects.map(p => p.id === editingProject.id ? editingProject : p);
                    onUpdateProjects(updated);
                    saveUsersToAWS(updated).catch(err => console.warn('AWS S3 user update warning:', err));
                    setEditingProject(null);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Client Name</label>
                    <input 
                      type="text" 
                      required 
                      value={editingProject.clientName}
                      onChange={(e) => setEditingProject({ ...editingProject, clientName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-amber-400 mb-1 font-semibold">Client Email Address (For Google Email Login)</label>
                    <input 
                      type="email" 
                      placeholder="e.g. client@gmail.com"
                      value={editingProject.clientEmail || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, clientEmail: e.target.value })}
                      className="w-full bg-zinc-950 border border-amber-500/40 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">Client will use this email address to log in to their account.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Client Phone Number</label>
                    <input 
                      type="tel" 
                      required 
                      value={editingProject.clientPhone || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, clientPhone: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Passcode (For Client Access Key)</label>
                    <input 
                      type="text" 
                      required 
                      value={editingProject.passcode}
                      onChange={(e) => setEditingProject({ ...editingProject, passcode: e.target.value.toUpperCase() })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white uppercase font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Event Category</label>
                      <select
                        value={editingProject.category}
                        onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Weddings">Weddings</option>
                        <option value="Pre-Weddings">Pre-Weddings</option>
                        <option value="Portraits">Portraits</option>
                        <option value="Events">Events</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Status</label>
                      <select
                        value={editingProject.status}
                        onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="reviewing">In Review</option>
                        <option value="submitted">Submitted</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Event Date</label>
                    <input 
                      type="text" 
                      value={editingProject.date}
                      onChange={(e) => setEditingProject({ ...editingProject, date: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Description / Instructions</label>
                    <textarea 
                      rows={2}
                      value={editingProject.description || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </form>
              </div>

              <div className="flex gap-2 pt-2.5 border-t border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="flex-1 py-2 sm:py-2.5 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs sm:text-sm transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-client-form"
                  className="flex-1 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs sm:text-sm transition font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SINGLE DROPDOWN DIRECT MEDIA UPLOADER MODAL */}
        {showAddMediaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl relative my-8">
              
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Upload Media to {activeProject.clientName}</h3>
                </div>
                <button 
                  onClick={() => setShowAddMediaModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadSuccessMessage && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              {/* AWS S3 BATCH UPLOAD PROGRESS DRAWER */}
              {isUploadingToAws && (
                <div className="p-4 bg-sky-950/50 border border-sky-500/50 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-sky-300">
                    <span className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 animate-bounce text-sky-400" />
                      <span>Uploading Batch ({batchCompletedCount} / {batchTotalCount} files)</span>
                    </span>
                    <span className="font-mono text-amber-400 font-extrabold text-sm">{awsUploadProgress}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-sky-500/30">
                    <div 
                      className="bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 h-3 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${awsUploadProgress}%` }}
                    />
                  </div>

                  {currentUploadingFile && (
                    <div className="text-[11px] text-zinc-300 truncate font-mono flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                      <span className="text-zinc-400">Processing:</span>
                      <span className="text-white font-medium truncate">{currentUploadingFile}</span>
                    </div>
                  )}

                  {/* Batch File Feed List */}
                  {batchQueue.length > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 text-[11px] font-mono">
                      {batchQueue.slice(0, 15).map((q) => (
                        <div key={q.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-zinc-900/60 transition">
                          <span className="truncate max-w-[220px] text-zinc-300">{q.filename}</span>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-zinc-500">{q.sizeFormatted}</span>
                            {q.status === 'completed' && <span className="text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3"/> Done</span>}
                            {q.status === 'uploading' && <span className="text-sky-400 font-bold flex items-center gap-0.5"><Loader2 className="w-3 h-3 animate-spin"/> Uploading</span>}
                            {q.status === 'queued' && <span className="text-zinc-500">Queued</span>}
                            {q.status === 'error' && <span className="text-rose-400 font-bold">Error</span>}
                          </div>
                        </div>
                      ))}
                      {batchQueue.length > 15 && (
                        <div className="text-[10px] text-zinc-500 text-center pt-1 font-sans">
                          + {batchQueue.length - 15} more files remaining in batch queue...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                
                {/* SINGLE FORMAT DROPDOWN */}
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                    Select Upload Format / Media Category
                  </label>
                  <select
                    value={selectedFormatCategory}
                    onChange={(e) => setSelectedFormatCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-amber-500/40 rounded-xl px-3.5 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-400 shadow-md cursor-pointer"
                  >
                    <option value="AUTO">✨ Auto-Detect All Formats (Images, RAW, Videos, Links)</option>
                    <option value="PHOTO">📷 Photo / Image Files (JPEG, PNG, WEBP, HEIC, RAW, CR2, NEF, TIFF)</option>
                    <option value="VIDEO">🎥 Video / Film Files (MP4, MOV, WEBM, AVI, MKV, M4V)</option>
                    <option value="EMBED">🔗 Online Video Stream / Link (YouTube, Vimeo, Google Drive)</option>
                  </select>
                </div>

                {/* DIRECT LOCAL FILE UPLOAD BOX */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      1. Bulk Upload Files Directly from Device
                    </label>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Batch Mode (Select 1 to 100+ Files)
                    </span>
                  </div>

                  <div 
                    className={`border-2 border-dashed rounded-xl p-6 text-center bg-zinc-950/60 cursor-pointer transition relative group ${
                      isDragOver ? 'border-amber-400 bg-amber-500/10' : 'border-zinc-700 hover:border-amber-500/60'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processBatchFiles(e.dataTransfer.files);
                      }
                    }}
                  >
                    <input 
                      type="file" 
                      multiple 
                      accept={
                        selectedFormatCategory === 'PHOTO' ? "image/*,.cr2,.nef,.arw,.heic,.raw,.tiff,.webp,.svg" :
                        selectedFormatCategory === 'VIDEO' ? "video/*,.mp4,.mov,.webm,.avi,.mkv,.m4v" :
                        "image/*,video/*,.cr2,.nef,.arw,.heic,.raw,.tiff,.webp,.svg,.mp4,.mov,.webm,.avi,.mkv"
                      }
                      onChange={handleDirectFilesSelect}
                      disabled={isUploadingToAws}
                      className="hidden" 
                      id="direct-media-file-input"
                    />
                    <label htmlFor="direct-media-file-input" className="cursor-pointer space-y-2 block">
                      <Upload className="w-9 h-9 text-amber-400 mx-auto group-hover:scale-110 transition" />
                      <div className="text-sm font-bold text-white">Select or Drag & Drop 1 to 100+ Media Files Here</div>
                      <div className="text-xs text-zinc-400">
                        Select multiple photos (JPEG, RAW, PNG) or videos at once. High-speed parallel cloud upload.
                      </div>
                      <span className="inline-block mt-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-lg transition shadow">
                        📁 Browse & Batch Upload All Files
                      </span>
                    </label>
                  </div>
                </div>

                {/* OR PASTE DIRECT URL LINK */}
                <form onSubmit={handleSaveMediaUrl} className="pt-3 border-t border-zinc-800 space-y-3">
                  <label className="block text-xs font-medium text-zinc-300">
                    2. Or Add via URL Link / YouTube / Vimeo / Drive
                  </label>
                  
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Wedding Highlight Title (Optional)"
                      value={mediaTitleInput}
                      onChange={(e) => setMediaTitleInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Paste image or video URL (https://...)"
                        value={mediaUrlInput}
                        onChange={(e) => setMediaUrlInput(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                      <button
                        type="submit"
                        disabled={!mediaUrlInput.trim()}
                        className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 disabled:opacity-40 font-bold px-3 py-2 rounded-lg text-xs transition border border-amber-500/30 whitespace-nowrap"
                      >
                        Add Link
                      </button>
                    </div>
                  </div>
                </form>

                {/* MODAL CANCEL BUTTON */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddMediaModal(false)}
                    className="w-full py-2.5 bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition"
                  >
                    Done / Close
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* DELETE CLIENT CONFIRMATION MODAL */}
        {projectToDelete && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Delete Client Account?</h3>
                    <p className="text-xs text-rose-400 font-medium">Permanent Action</p>
                  </div>
                </div>
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <p className="leading-relaxed">
                  Are you sure you want to delete the gallery for <strong className="text-white text-sm">{projectToDelete.clientName}</strong>?
                </p>
                
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div><span className="text-zinc-500">Passcode:</span> <strong className="text-amber-400">{projectToDelete.passcode}</strong></div>
                  <div><span className="text-zinc-500">Category & Date:</span> {projectToDelete.category} ({projectToDelete.date})</div>
                  <div><span className="text-zinc-500">Stored Media:</span> {(projectToDelete.images || []).length} Photos, {(projectToDelete.videos || []).length} Videos</div>
                </div>

                <p className="text-rose-400 font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  ⚠️ Warning: This action will delete this client account and all associated proofing selections.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteProject(projectToDelete.id)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete Client</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE INQUIRY CONFIRMATION MODAL */}
        {inquiryToDelete && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Delete Booking Inquiry?</h3>
                    <p className="text-xs text-rose-400 font-medium">Permanent Action</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInquiryToDelete(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <p className="leading-relaxed">
                  Are you sure you want to delete the booking inquiry from <strong className="text-white text-sm">{inquiryToDelete.name}</strong>?
                </p>
                
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div><span className="text-zinc-500">Service:</span> <strong className="text-amber-400">{inquiryToDelete.service}</strong></div>
                  <div><span className="text-zinc-500">Phone:</span> {inquiryToDelete.phone}</div>
                  <div><span className="text-zinc-500">Email:</span> {inquiryToDelete.email || 'N/A'}</div>
                  <div><span className="text-zinc-500">Submitted:</span> {inquiryToDelete.submittedAt}</div>
                </div>

                <p className="text-rose-400 font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  ⚠️ Warning: This will permanently remove this inquiry from your admin records.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInquiryToDelete(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteInquiry(inquiryToDelete.id)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete Inquiry</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AWS S3 CLOUD STORAGE SETTINGS & STATUS MODAL */}
        {showAwsModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-sky-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-8">
              
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      AWS S3 Cloud Storage Integration
                    </h3>
                    <p className="text-xs text-sky-400 font-medium">GK Digital Studios • High-Speed Cloud Storage</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAwsModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                s3Status?.configured 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <Server className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>Status: {s3Status?.configured ? 'AWS S3 Active & Connected' : 'AWS Credentials Standby'}</span>
                    <span className={`w-2 h-2 rounded-full ${s3Status?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  </div>
                  <p className="leading-relaxed opacity-90">{s3Status?.message}</p>
                </div>
              </div>

              {/* Bucket Config Info */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs font-mono">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block">AWS Region</span>
                  <span className="text-white font-bold">{s3Status?.region || 'us-east-1'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block">S3 Bucket Name</span>
                  <span className="text-amber-400 font-bold">{s3Status?.bucketName || 'gk-digital-studios-storage'}</span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">AWS S3 Cloud Storage Capabilities:</h4>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>4K Video Streaming:</strong> Direct streaming for cinematic teaser trailers and highlight films.</span>
                  </li>
                  <li className="flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Full-Resolution RAW/JPEG Photos:</strong> Uncompressed uploads for wedding proofing galleries.</span>
                  </li>
                  <li className="flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Secure Presigned Access:</strong> Automated client authorization for secure photo downloads.</span>
                  </li>
                </ul>
              </div>

              {/* AWS Environment Variables Setup Instructions */}
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  <span>How to connect your AWS S3 Account:</span>
                </h4>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Add the following keys to your project environment variables or <code className="text-amber-300 font-mono">.env</code> file:
                </p>
                <div className="bg-zinc-900 p-2.5 rounded-lg font-mono text-[11px] text-zinc-300 space-y-1 select-all border border-zinc-800">
                  <div>AWS_REGION="us-east-1"</div>
                  <div>AWS_ACCESS_KEY_ID="AKIA..."</div>
                  <div>AWS_SECRET_ACCESS_KEY="wJalrX..."</div>
                  <div>AWS_S3_BUCKET_NAME="your-bucket-name"</div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    checkS3Status().then(setS3Status);
                  }}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sky-400 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-zinc-700"
                >
                  <Server className="w-4 h-4" />
                  <span>Refresh Connection</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAwsModal(false)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/10"
                >
                  Close & Continue
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Fullscreen Interactive Video Player Modal */}
        {previewVideo && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-4 p-6 relative">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <VideoIcon className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white truncate max-w-md">{previewVideo.title}</h3>
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    .{previewVideo.format || detectFormat(previewVideo.videoUrl, true)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Box */}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-inner">
                {(() => {
                  const embedInfo = getEmbedVideoUrl(previewVideo.videoUrl);
                  return embedInfo.isDirectVideo ? (
                    <video
                      key={embedInfo.url}
                      src={embedInfo.url}
                      controls
                      autoPlay
                      playsInline
                      preload="auto"
                      poster={previewVideo.thumbnailUrl || undefined}
                      className="w-full h-full object-contain"
                    >
                      <source src={embedInfo.url} />
                      Your browser does not support HTML5 video playback.
                    </video>
                  ) : (
                    <iframe
                      src={embedInfo.url}
                      title={previewVideo.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                })()}
              </div>

              {/* Video Info Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <p className="text-xs text-zinc-300">{previewVideo.description || 'Cinematic wedding and event video film.'}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 break-all">Stream Source: {previewVideo.videoUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition shadow-lg shrink-0"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
