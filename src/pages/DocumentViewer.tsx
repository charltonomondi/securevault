import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { SecureDocumentViewer } from '@/components/SecureDocumentViewer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, FileStack, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Document {
  id: string;
  title: string;
  description: string | null;
  page_count: number | null;
  file_path: string;
  text_content?: string | null;
}

const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('id, title, description, page_count, file_path')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        setError('Failed to load document');
      } else if (!data) {
        setError('Document not found');
      } else {
        setDocument(data);
        
        // Log the view
        if (user) {
          await supabase.from('document_views').insert({
            document_id: id,
            user_id: user.id
          });
        }
      }
      setLoading(false);
    };

    if (user) {
      fetchDocument();
    }
  }, [id, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">
              {error || 'Document not found'}
            </h2>
            <p className="text-muted-foreground mb-6">
              The document you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Documents
              </Link>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-6 flex flex-col">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Documents
            </Link>
          </Button>
        </motion.div>

        {/* Document Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-card rounded-lg border border-border overflow-hidden shadow-medium"
        >
          {document.file_path ? (
            <SecureDocumentViewer
              documentId={document.id}
              title={document.title}
              pdfUrl={supabase.storage.from('documents').getPublicUrl(document.file_path).data.publicUrl}
              textContent={document.text_content || undefined}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg border border-border">
              <FileStack className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Document file not available</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default DocumentViewer;
