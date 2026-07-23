import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Heart, 
  MessageSquare, 
  ZoomIn, 
  Send, 
  Video as VideoIcon, 
  Image as ImageIcon, 
  LogOut, 
  Download, 
  Sparkles, 
  Check, 
  Calendar, 
  User, 
  Lock, 
  X,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProofProject, ProofImage, ProofVideo, UserSession } from '../types';
import { getEmbedVideoUrl, detectFormat, resolveImageUrl } from '../utils/media';

interface ClientPortalProps {
  session: UserSession;
  project: ProofProject;
  onUpdateProject: (updated: ProofProject) => void;
  onLogout: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  session,
  project,
  onUpdateProject,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'submit'>('photos');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedZoomImg, setSelectedZoomImg] = useState<ProofImage | null>(null);
  const [activeVideo, setActiveVideo] = useState<ProofVideo | null>(project.videos?.[0] || null);

  // Comment editing
  const [editingCommentImgId, setEditingCommentImgId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Submission notes
  const [notes, setNotes] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Toggle image selection
  const handleToggleSelect = (imgId: string) => {
    const updatedImages = (project.images || []).map(img => {
      if (img.id === imgId) {
        return { ...img, selected: !img.selected };
      }
      return img;
    });

    onUpdateProject({ ...project, images: updatedImages });
  };

  // Save image comment
  const handleSaveComment = (imgId: string) => {
    const updatedImages = (project.images || []).map(img => {
      if (img.id === imgId) {
        return { ...img, comment: commentText };
      }
      return img;
    });

    onUpdateProject({ ...project, images: updatedImages });
    setEditingCommentImgId(null);
    setCommentText('');
  };

  // Submit proof choices
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCount = (project.images || []).filter(i => i?.selected).length;
    if (selectedCount === 0) {
      alert('Please select at least 1 photo for your album before submitting.');
      return;
    }

    const updated: ProofProject = {
      ...project,
      status: 'submitted',
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      selectionNotes: notes
    };

    onUpdateProject(updated);
    setSubmitSuccess(true);
  };

  const selectedCount = (project.images || []).filter(i => i?.selected).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Client Welcome Header */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0 overflow-hidden">
              {session.avatar ? (
                <img src={session.avatar} alt={session.name} className="w-full h-full object-cover" />
              ) : (
                (session?.name || 'Client').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{project.clientName}'s Gallery</h1>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-semibold ${
                  project.status === 'submitted' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {project.status === 'submitted' ? 'Proof Submitted' : 'Active Proofing'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-400">
                  {project.category} • Date: {project.date}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats Pill */}
            <div className="px-3.5 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300">
              <span className="text-emerald-400 font-bold text-sm">{selectedCount}</span> / {(project.images || []).length} Selected
            </div>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
              activeTab === 'photos'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photo Proofing ({project.images.length})</span>
          </button>

          {(project.videos && project.videos.length > 0) && (
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
                activeTab === 'videos'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>Cinematic Films ({project.videos.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('submit')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit Selections ({selectedCount})</span>
          </button>
        </div>

        {/* TAB 1: PHOTO PROOFING GALLERY */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p>
                Click the <span className="text-emerald-400 font-bold">♥ Select</span> button on photos you want in your album. Click <span className="text-amber-400 font-bold">💬 Note</span> to request specific retouching.
              </p>
              <div className="font-mono text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shrink-0">
                {selectedCount} Photos Selected
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {project.images.map((img) => (
                <div 
                  key={img.id}
                  className={`relative bg-zinc-900 border rounded-2xl overflow-hidden transition-all group ${
                    img.selected ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
                    <img 
                      src={resolveImageUrl(img.url)} 
                      alt={img.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      {img.selected ? (
                        <span className="bg-emerald-500 text-zinc-950 font-extrabold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                        </span>
                      ) : (
                        <span className="bg-zinc-900/80 backdrop-blur-md text-zinc-400 text-[10px] px-2.5 py-1 rounded-full font-mono">
                          Unselected
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedZoomImg(img)}
                        className="pointer-events-auto p-2 bg-zinc-950/80 hover:bg-zinc-900 text-white rounded-full transition shadow"
                        title="Zoom High-Res"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action Bar Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSelect(img.id)}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg ${
                          img.selected 
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950' 
                            : 'bg-zinc-900/90 hover:bg-amber-500 text-white hover:text-zinc-950 border border-zinc-700'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${img.selected ? 'fill-zinc-950' : ''}`} />
                        <span>{img.selected ? 'Selected' : 'Select Photo'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingCommentImgId(img.id);
                          setCommentText(img.comment || '');
                        }}
                        className={`p-2 rounded-xl border transition ${
                          img.comment 
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                            : 'bg-zinc-900/90 border-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                        title="Add retouching comment"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-white truncate">{img.title}</h3>

                    {/* Comment display or form */}
                    {editingCommentImgId === img.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="e.g. Skin retouch, crop tighter..."
                          className="w-full bg-zinc-950 border border-amber-500/50 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingCommentImgId(null)}
                            className="flex-1 py-1 bg-zinc-800 text-zinc-400 text-xs rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveComment(img.id)}
                            className="flex-1 py-1 bg-amber-500 text-zinc-950 font-bold text-xs rounded"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      img.comment && (
                        <p className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 italic">
                          "{img.comment}"
                        </p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CINEMATIC VIDEOS */}
        {activeTab === 'videos' && project.videos && project.videos.length > 0 && (
          <div className="space-y-6">
            {(() => {
              const currentVid = (activeVideo && project.videos.some(v => v.id === activeVideo.id))
                ? activeVideo
                : project.videos[0];
              if (!currentVid) return null;
              const embedInfo = getEmbedVideoUrl(currentVid.videoUrl);
              const fmt = currentVid.format || detectFormat(currentVid.videoUrl, true);
              return (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-800">
                    {embedInfo.isDirectVideo ? (
                      <video 
                        key={embedInfo.url}
                        src={embedInfo.url}
                        controls 
                        playsInline
                        preload="auto"
                        poster={currentVid.thumbnailUrl || undefined}
                        className="w-full h-full object-contain"
                      >
                        <source src={embedInfo.url} />
                        Your browser does not support HTML5 video playback.
                      </video>
                    ) : (
                      <iframe 
                        src={embedInfo.url} 
                        title={currentVid.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{currentVid.title}</h3>
                        <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          .{fmt}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{currentVid.description}</p>
                    </div>
                    <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 self-start sm:self-auto">
                      {currentVid.duration}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {project.videos.map((vid) => {
                const vidFmt = vid.format || detectFormat(vid.videoUrl, true);
                const currentVidId = activeVideo?.id || project.videos[0]?.id;
                const vidEmbed = getEmbedVideoUrl(vid.videoUrl);
                return (
                  <button
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    className={`text-left p-3.5 rounded-xl border transition flex gap-3 ${
                      currentVidId === vid.id ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {vidEmbed.isDirectVideo ? (
                      <video 
                        src={vidEmbed.url} 
                        poster={vid.thumbnailUrl || undefined}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-20 h-16 rounded-lg object-cover shrink-0 bg-black pointer-events-none" 
                      />
                    ) : (
                      <img 
                        src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80'} 
                        alt={vid.title} 
                        className="w-20 h-16 rounded-lg object-cover shrink-0" 
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{vid.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-amber-400 font-mono">{vid.duration}</span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-800 px-1.5 py-0.5 rounded">.{vidFmt}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SUBMIT SELECTIONS */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Submit Album Proofing Selection</h3>
                  <p className="text-xs text-zinc-400">GK Digital Studios • Direct Studio Handover</p>
                </div>
              </div>

              {submitSuccess ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-xl font-bold text-white">Album Proof Submitted!</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto">
                    Thank you, <strong>{project.clientName}</strong>! Govind Kumar Gella and the GK Digital Studios team have received your <strong>{selectedCount} selected photos</strong> and retouching notes. We will begin processing your album spreads.
                  </p>
                  <div className="text-xs font-mono text-emerald-400 pt-2">
                    Submission Time: {project.submittedAt || 'Today'}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-300">
                      <span>Selected Photos Count:</span>
                      <strong className="text-amber-400 font-mono text-sm">{selectedCount} Photos</strong>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Client Account:</span>
                      <strong className="text-white">{project.clientName} ({session.phone || session.email})</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Special Notes for Album Design / Retouching
                    </label>
                    <textarea 
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Please put photo #2 as full spread on cover, retouched lighting preferred..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3.5 rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Final Selections to Govind Kumar Gella</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* HIGH RES ZOOM MODAL */}
        {selectedZoomImg && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
            onClick={() => setSelectedZoomImg(null)}
          >
            <div 
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedZoomImg(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white rounded-xl border border-zinc-700 transition flex items-center gap-1.5 text-xs font-bold z-30 shadow-lg"
                title="Close Image Preview"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Close</span>
              </button>

              <div className="w-full flex justify-center items-center my-2 pt-2">
                <img 
                  src={resolveImageUrl(selectedZoomImg.url)} 
                  alt={selectedZoomImg.title} 
                  className="max-h-[55vh] sm:max-h-[60vh] md:max-h-[65vh] w-auto max-w-full object-contain rounded-xl border border-zinc-800 shadow-2xl"
                />
              </div>

              <div className="mt-3 text-center space-y-1">
                <h4 className="text-lg sm:text-xl font-bold text-white">{selectedZoomImg.title}</h4>
                {selectedZoomImg.comment && (
                  <p className="text-xs text-amber-300 italic">"{selectedZoomImg.comment}"</p>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedZoomImg(null)}
                    className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold rounded-xl border border-zinc-700 transition shadow-md"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
