import React from 'react';
import { Trash2, X } from 'lucide-react';
import { PortfolioItem } from '../types';

interface DeletePortfolioModalProps {
  item: PortfolioItem | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const DeletePortfolioModal: React.FC<DeletePortfolioModalProps> = ({
  item,
  onClose,
  onConfirmDelete
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Portfolio Image?</h3>
              <p className="text-xs text-rose-400 font-medium">Permanent Action</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Thumbnail */}
        <div className="space-y-3 text-xs text-zinc-300">
          <p className="leading-relaxed">
            Are you sure you want to delete <strong className="text-white text-sm">{item.title}</strong> from the main website portfolio?
          </p>
          
          <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 relative">
            <img 
              src={item.url} 
              alt={item.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono text-[10px]">
              {item.category}
            </div>
          </div>

          <p className="text-rose-400 font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
            ⚠️ Warning: Deleting this image will remove it from all client gallery views and the main website pages.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(item.id)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/20 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Delete Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
