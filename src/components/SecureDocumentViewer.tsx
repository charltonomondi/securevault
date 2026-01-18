import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WatermarkOverlay } from './WatermarkOverlay';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { attachSecurityListeners } from '@/lib/security';
import { useAuth } from '@/hooks/useAuth';
import { Shield, AlertTriangle, ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document, Page, pdfjs } from 'react-pdf';
import { getDocument } from 'pdfjs-dist';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface SecureDocumentViewerProps {
  documentId: string;
  title: string;
  pdfUrl?: string;
  textContent?: string;
}

export const SecureDocumentViewer = ({ documentId, title, pdfUrl, textContent }: SecureDocumentViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useTabVisibility();
  const { profile } = useAuth();
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [documentText, setDocumentText] = useState<string>('');
  const [isVoiceReading, setIsVoiceReading] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);


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

  const toggleVoiceReading = () => {
    if (!('speechSynthesis' in window) || !documentText || documentText.includes('not available')) return;

    if (isVoiceReading) {
      window.speechSynthesis.cancel();
      setIsVoiceReading(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(documentText);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        setIsVoiceReading(false);
      };

      utterance.onerror = () => {
        setIsVoiceReading(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsVoiceReading(true);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle keyboard navigation when not typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault();
        if (scale < 2) zoomIn();
        break;
      case '-':
        e.preventDefault();
        if (scale > 0.5) zoomOut();
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        if ('speechSynthesis' in window && documentText && !documentText.includes('not available')) {
          toggleVoiceReading();
        }
        break;
      case 'Escape':
        if (isVoiceReading) {
          e.preventDefault();
          toggleVoiceReading();
        }
        break;
    }
  };


  const extractTextFromPDF = async (url: string) => {
    try {
      const loadingTask = getDocument(url);
      const pdf = await loadingTask.promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      setDocumentText(text);
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      setDocumentText('Text extraction not available');
    }
  };

  useEffect(() => {
    if (textContent) {
      setDocumentText(textContent);
    } else if (pdfUrl) {
      extractTextFromPDF(pdfUrl);
    }
  }, [pdfUrl, textContent]);

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted/30 rounded-lg border border-border">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No document content available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" role="application" aria-label="Secure Document Viewer">
      {/* Skip link for screen readers */}
      <a
        href="#document-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        Skip to document content
      </a>

      {/* Toolbar */}
      <header
        className="flex items-center justify-between px-4 py-3 bg-card border-b border-border"
        role="toolbar"
        aria-label="Document viewer controls"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-accent" aria-hidden="true" />
          <h1 className="font-medium text-sm" id="document-title">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="icon"
             onClick={zoomOut}
             disabled={scale <= 0.5}
             className="h-8 w-8"
             aria-label={`Zoom out. Current zoom: ${Math.round(scale * 100)}%`}
           >
             <ZoomOut className="w-4 h-4" aria-hidden="true" />
           </Button>
           <span
             className="text-sm text-muted-foreground min-w-[60px] text-center"
             aria-live="polite"
             aria-label={`Current zoom level: ${Math.round(scale * 100)}%`}
           >
             {Math.round(scale * 100)}%
           </span>
           <Button
             variant="ghost"
             size="icon"
             onClick={zoomIn}
             disabled={scale >= 2}
             className="h-8 w-8"
             aria-label={`Zoom in. Current zoom: ${Math.round(scale * 100)}%`}
           >
             <ZoomIn className="w-4 h-4" aria-hidden="true" />
           </Button>

           {/* Voice Reading Controls */}
           {('speechSynthesis' in window) && (
             <>
               <div className="w-px h-6 bg-border mx-2" />
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={toggleVoiceReading}
                 disabled={!documentText || documentText.includes('not available')}
                 className={`h-8 w-8 ${isVoiceReading ? 'text-accent' : ''}`}
                 title={isVoiceReading ? 'Stop voice reading' : 'Start voice reading'}
               >
                 {isVoiceReading ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
               </Button>
             </>
           )}
         </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            PDF Document
          </span>
        </div>
     </header>

     {/* Voice reading status - live region for screen readers */}
     <div
       aria-live="polite"
       aria-atomic="true"
       className="sr-only"
       role="status"
     >
       {isVoiceReading
         ? 'Voice reading in progress'
         : documentText && !documentText.includes('not available')
           ? 'Voice reading available'
           : 'Voice reading not available'
       }
     </div>

     {/* Document Viewer */}
     <main
       id="document-content"
       ref={containerRef}
       className={`secure-viewer flex-1 relative overflow-auto bg-muted/30 no-select ${!isVisible ? 'blur-on-unfocus is-blurred' : ''}`}
       role="main"
       aria-label="Document content area. Use + and - keys to zoom, Space to play/pause voice reading, Enter to start voice reading, Escape to stop."
       tabIndex={0}
       onKeyDown={handleKeyDown}
     >
        {isMobile ? (
          <div
            ref={containerRef}
            className="flex-1 relative overflow-auto bg-muted/30"
          >
            <WatermarkOverlay
              userEmail={profile?.email || 'anonymous'}
              userName={profile?.full_name || undefined}
              containerRef={containerRef}
            />
            {pdfError ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">Mobile Viewing</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Unable to load PDF directly. Please open the document in your browser.
                </p>
                <Button asChild>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Open Document
                  </a>
                </Button>
              </div>
            ) : (
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={() => setPdfError(true)}
                className="flex flex-col items-center p-4"
                loading=""
              >
                {numPages && Array.from(new Array(numPages), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    scale={scale}
                    className="mb-4 shadow-lg"
                  />
                ))}
              </Document>
            )}
          </div>
        ) : (
        <>
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
            className="shadow-large rounded-lg overflow-hidden w-full max-w-6xl relative"
          >
            {pdfError ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">Document Loading Error</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Unable to load the PDF document. This may be due to network issues or access restrictions.
                </p>
                <Button asChild>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Try Opening in Browser
                  </a>
                </Button>
              </div>
            ) : (
              <>
                <iframe
                  src={pdfUrl}
                  className="w-full h-[100000px] border-0 select-none pointer-events-none"
                  title={title}
                  onContextMenu={(e) => e.preventDefault()}
                  onError={() => setPdfError(true)}
                  style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
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
              </>
            )}
          </motion.div>
        </div>
        </>
        )}
      </main>
    </div>
  );
};
