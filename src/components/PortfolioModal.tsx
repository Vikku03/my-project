import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Sparkles, Check, Loader2 } from 'lucide-react';
import { PortfolioItem } from '../types';
import { uploadFileToAWS } from '../lib/aws';
import { resolveImageUrl } from '../utils/media';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: { id?: string; title: string; category: PortfolioItem['category']; description: string; url: string }) => void;
  editingItem?: PortfolioItem | null;
}

const CATEGORIES: PortfolioItem['category'][] = [
  'Weddings',
  'Pre-Weddings',
  'Portraits',
  'Events',
  'Drone',
  'Commercial',
  'AI Creations'
];

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PortfolioItem['category']>('Weddings');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setCategory(editingItem.category || 'Weddings');
      setDescription(editingItem.description || '');
      setImageUrl(editingItem.url || '');
      setInputMode(editingItem.url?.startsWith('data:') ? 'upload' : 'url');
    } else {
      setTitle('');
      setCategory('Weddings');
      setDescription('');
      setImageUrl('');
      setInputMode('upload');
    }
    setUploadError('');
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    setIsUploading(true);

    const filesArray: File[] = Array.from(files);

    if (filesArray.length === 1) {
      const file = filesArray[0];
      setBatchProgressText('Uploading photo to AWS S3...');
      try {
        const res = await uploadFileToAWS(file, 'gk-media/portfolio');
        if (res.url) {
          setImageUrl(res.url);
          if (!title) {
            setTitle(file.name.replace(/\.[^/.]+$/, ''));
          }
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) setImageUrl(event.target.result as string);
          };
          reader.readAsDataURL(file);
        }
      } catch (err: any) {
        console.warn('Portfolio S3 Upload error:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) setImageUrl(event.target.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploading(false);
        setBatchProgressText('');
      }
    } else {
      // Bulk batch upload multiple portfolio photos (10, 50, 100+)
      let completed = 0;
      const total = filesArray.length;
      
      const CONCURRENCY = 5;
      let currentIndex = 0;

      const uploadWorker = async () => {
        while (currentIndex < filesArray.length) {
          const idx = currentIndex++;
          const file = filesArray[idx];
          const itemTitle = title ? `${title.trim()} - ${idx + 1}` : file.name.replace(/\.[^/.]+$/, '');
          
          try {
            const res = await uploadFileToAWS(file, 'gk-media/portfolio');
            const mediaUrl = res.url || '';
            if (mediaUrl) {
              onSave({
                title: itemTitle,
                category,
                description: description.trim() || `Portfolio showcase photo`,
                url: mediaUrl
              });
            }
          } catch (err) {
            console.error('Batch upload portfolio photo error:', err);
          }

          completed++;
          setBatchProgressText(`Uploaded ${completed} of ${total} photos (${Math.round((completed / total) * 100)}%)...`);
        }
      };

      const workers = [];
      for (let w = 0; w < Math.min(CONCURRENCY, filesArray.length); w++) {
        workers.push(uploadWorker());
      }

      await Promise.all(workers);

      setIsUploading(false);
      setBatchProgressText('');
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError('Please enter an image title.');
      return;
    }
    if (!imageUrl.trim()) {
      setUploadError('Please provide an image URL or upload a photo.');
      return;
    }

    onSave({
      id: editingItem?.id,
      title: title.trim(),
      category,
      description: description.trim(),
      url: imageUrl.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingItem ? 'Edit Website Image' : 'Add New Website Image'}
              </h3>
              <p className="text-xs text-zinc-400">
                {editingItem ? 'Update details for client gallery view' : 'Upload photo to showcase in main portfolio'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {uploadError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {uploadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Image Input Selection Modes */}
          <div className="space-y-2">
            <label className="block text-zinc-300 font-semibold">Select Photo Source</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  inputMode === 'upload'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload From Device</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  inputMode === 'url'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Image Web URL</span>
              </button>
            </div>
          </div>

          {/* Upload File Input */}
          {inputMode === 'upload' ? (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-2xl p-6 text-center bg-zinc-950/60 cursor-pointer transition relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-wait"
                />
                {isUploading ? (
                  <div className="space-y-2 py-2">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                    <div className="text-amber-300 font-bold text-xs">{batchProgressText || 'Uploading photos...'}</div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition" />
                    <div className="text-white font-bold text-xs">Click or drag & drop photo(s) here</div>
                    <div className="text-[10px] text-zinc-400 mt-1">Supports batch upload (Select 1, 10, 50, 100+ files)</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Image URL Input */
            <div className="space-y-1">
              <label className="block text-zinc-400">Direct Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-123456789..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Live Thumbnail Preview */}
          {imageUrl && (
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Photo Preview</span>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-rose-400 hover:underline"
                >
                  Remove Photo
                </button>
              </div>
              <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                <img
                  src={resolveImageUrl(imageUrl)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setUploadError('Image failed to load. Please check the URL or upload a valid file.')}
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-zinc-400">Photo Title *</label>
            <input
              type="text"
              placeholder="e.g. Royal Temple Wedding Vows"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="block text-zinc-400">Gallery Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-zinc-400">Description / Details</label>
            <textarea
              rows={3}
              placeholder="Tell clients about the shot, venue, camera setup, or moment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingItem ? 'Save Changes' : 'Publish Image'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
