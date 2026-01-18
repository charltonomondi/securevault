-- Add text_content column to documents table for voice reading functionality
ALTER TABLE public.documents
ADD COLUMN text_content TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.documents.text_content IS 'Extracted text content from the document for voice reading functionality';