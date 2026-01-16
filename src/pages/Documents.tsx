import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { DocumentCard } from '@/components/DocumentCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, FileStack, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface Document {
  id: string;
  title: string;
  description: string | null;
  page_count: number | null;
  created_at: string;
}

const Documents = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, description, page_count, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDocuments(data);
      }
      setLoading(false);
    };

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <FileStack className="w-12 h-12 text-primary/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/src/assests/logo.png"
              alt="Peaks Hotel Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2 text-accent mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Secure Repository</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Document Library
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Browse and view documents securely. All access is monitored and watermarked for your protection.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <FileStack className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground max-w-sm">
              {searchQuery 
                ? `No documents match "${searchQuery}". Try a different search term.`
                : 'No documents are currently available. Check back later.'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DocumentCard
                  id={doc.id}
                  title={doc.title}
                  description={doc.description || undefined}
                  pageCount={doc.page_count || 1}
                  createdAt={doc.created_at}
                  onClick={() => navigate(`/view/${doc.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Documents;
