import { motion } from 'framer-motion';
import { FileText, Clock, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface DocumentCardProps {
  id: string;
  title: string;
  description?: string;
  pageCount: number;
  createdAt: string;
  onClick: () => void;
}

export const DocumentCard = ({ id, title, description, pageCount, createdAt, onClick }: DocumentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer group overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 border-border/50"
        onClick={onClick}
      >
        <CardContent className="p-0">
          {/* Document Preview Placeholder */}
          <div className="relative h-40 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
            <FileText className="w-16 h-16 text-primary/30 group-hover:text-primary/50 transition-colors" />
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              View only
            </div>
          </div>

          {/* Document Info */}
          <div className="p-4 space-y-2">
            <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
              <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(createdAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
