import React, { useState, useEffect } from 'react';
import { X, Save, User, Award, Phone, Mail, Instagram, MapPin, Plus, Trash2, Globe, FileText } from 'lucide-react';
import { PersonalInfoData, PersonalInfoHighlight } from '../types';

interface EditAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalInfo: PersonalInfoData;
  onSave: (updatedInfo: PersonalInfoData) => void;
}

export const EditAboutModal: React.FC<EditAboutModalProps> = ({
  isOpen,
  onClose,
  personalInfo,
  onSave,
}) => {
  const [formData, setFormData] = useState<PersonalInfoData>(personalInfo);

  useEffect(() => {
    setFormData(personalInfo);
  }, [personalInfo, isOpen]);

  if (!isOpen) return null;

  const handleHighlightChange = (index: number, field: keyof PersonalInfoHighlight, value: string) => {
    const updated = [...formData.highlights];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, highlights: updated });
  };

  const handleAddHighlight = () => {
    setFormData({
      ...formData,
      highlights: [...formData.highlights, { label: 'New Highlight', value: 'Value' }]
    });
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Studio & About Details</h2>
              <p className="text-xs text-zinc-400">Update founder profile, contact info, and bio seen by clients.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Founder / Director Name</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Studio Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Professional Title / Credentials</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Studio Tagline</span>
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>
          </div>

          {/* Founder Image URL & Preview */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">Founder & Studio Portrait Image</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-24 h-32 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 shrink-0 shadow-lg relative group">
                <img 
                  src={formData.aboutImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"} 
                  alt="Founder Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] text-white font-bold text-center px-1">
                  Live Preview
                </div>
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Image Direct URL (Paste image link or choose preset)
                </label>
                <input
                  type="url"
                  value={formData.aboutImage || ''}
                  onChange={(e) => setFormData({ ...formData, aboutImage: e.target.value })}
                  placeholder="https://images.unsplash.com/... or your custom photo link"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                />
                
                {/* Preset choices for easy testing */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-zinc-500 font-semibold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, aboutImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" })}
                    className="text-[10px] px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition"
                  >
                    Portrait 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, aboutImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80" })}
                    className="text-[10px] px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition"
                  >
                    Portrait 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, aboutImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80" })}
                    className="text-[10px] px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition"
                  >
                    Portrait 3
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">Contact & Social Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>Instagram Link</span>
                </label>
                <input
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Google Maps Link</span>
                </label>
                <input
                  type="url"
                  value={formData.googleMaps}
                  onChange={(e) => setFormData({ ...formData, googleMaps: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Full Bio */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Founder Story / About Biography</span>
            </label>
            <textarea
              rows={5}
              value={formData.aboutLong}
              onChange={(e) => setFormData({ ...formData, aboutLong: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition leading-relaxed"
              required
            />
          </div>

          {/* Highlights */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">About Highlights & Statistics</h3>
              <button
                type="button"
                onClick={handleAddHighlight}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[11px] font-bold rounded-lg border border-zinc-700 transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Highlight</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formData.highlights.map((hl, index) => (
                <div key={index} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 relative group">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Experience)"
                      value={hl.label}
                      onChange={(e) => handleHighlightChange(index, 'label', e.target.value)}
                      className="w-full bg-transparent border-b border-zinc-800 focus:border-amber-500 text-[11px] text-zinc-400 focus:outline-none py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(index)}
                      className="text-zinc-600 hover:text-rose-400 transition shrink-0"
                      title="Remove highlight"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Value (e.g. 6+ Years)"
                    value={hl.value}
                    onChange={(e) => handleHighlightChange(index, 'value', e.target.value)}
                    className="w-full bg-transparent font-mono font-bold text-xs text-amber-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
