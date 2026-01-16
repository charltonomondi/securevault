import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WatermarkOverlay } from './WatermarkOverlay';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { attachSecurityListeners } from '@/lib/security';
import { useAuth } from '@/hooks/useAuth';
import { Shield, AlertTriangle, ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecureDocumentViewerProps {
  documentId: string;
  title: string;
  pdfUrl?: string;
}

export const SecureDocumentViewer = ({ documentId, title, pdfUrl }: SecureDocumentViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useTabVisibility();
  const { profile } = useAuth();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const cleanup = attachSecurityListeners();

    // Additional security measures
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'p' || e.key === 'P' || // Print
         e.key === 's' || e.key === 'S' || // Save
         e.key === 'c' || e.key === 'C' || // Copy
         e.key === 'a' || e.key === 'A' || // Select all
         e.key === 'u' || e.key === 'U')   // View source
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Disable F12 (dev tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Apply to document
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('dragstart', handleDragStart, true);

    // Apply to iframe when it loads
    const handleIframeLoad = () => {
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe?.contentDocument) {
        iframe.contentDocument.addEventListener('keydown', handleKeyDown, true);
        iframe.contentDocument.addEventListener('contextmenu', handleContextMenu, true);
      }
    };

    // Watch for iframe load
    const observer = new MutationObserver(() => {
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe) {
        iframe.addEventListener('load', handleIframeLoad);
        observer.disconnect();
      }
    });

    observer.observe(containerRef.current!, { childList: true, subtree: true });

    return () => {
      cleanup();
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      observer.disconnect();
    };
  }, []);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted/30 rounded-lg border border-border">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No document content available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-accent" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-8 w-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            disabled={scale >= 2}
            className="h-8 w-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            PDF Document
          </span>
        </div>
      </div>

      {/* Document Viewer */}
      <div 
        ref={containerRef}
        className={`secure-viewer flex-1 relative overflow-auto bg-muted/30 no-select ${!isVisible ? 'blur-on-unfocus is-blurred' : ''}`}
      >
        {/* Blur overlay when tab is not visible */}
        {!isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <p className="text-lg font-medium">Document Hidden</p>
              <p className="text-sm text-muted-foreground">Return to this tab to continue viewing</p>
            </div>
          </motion.div>
        )}

        {/* Watermark Overlay */}
        <WatermarkOverlay
          userEmail={profile?.email || 'anonymous'}
          userName={profile?.full_name || undefined}
          containerRef={containerRef}
        />

        {/* PDF Document */}
        <div className="flex justify-center p-4 min-h-full relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            className="shadow-large rounded-lg overflow-hidden w-full max-w-4xl relative"
          >
            <iframe
              src={pdfUrl}
              className="w-full h-[600px] border-0 select-none pointer-events-none"
              title={title}
              onContextMenu={(e) => e.preventDefault()}
            />

            {/* Security overlay to prevent interactions but allow scrolling */}
            <div
              className="absolute inset-0 bg-transparent pointer-events-auto"
              style={{
                background: 'transparent',
                zIndex: 10
              }}
              onClick={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              onMouseDown={(e) => {
                // Allow only middle mouse button (scroll wheel click)
                if (e.button !== 1) {
                  e.preventDefault();
                }
              }}
              onMouseUp={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onDoubleClick={(e) => e.preventDefault()}
              onTouchStart={(e) => {
                // Allow single touch for scrolling, prevent multi-touch gestures
                if (e.touches.length > 1) {
                  e.preventDefault(); // Prevent pinch zoom and other multi-touch
                }
              }}
              onTouchEnd={(e) => {
                // Allow touch end for scrolling completion
              }}
              onTouchMove={(e) => {
                // Allow touch move for scrolling
                // Natural scrolling behavior is preserved
              }}
              onWheel={(e) => {
                // Allow wheel scrolling
                // This is already allowed by default
              }}
            />

            {/* Invisible overlay for additional protection */}
            <div
              className="absolute inset-0 pointer-events-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.01)', // Nearly invisible
                zIndex: 5,
                pointerEvents: 'none' // Allow scrolling through
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
