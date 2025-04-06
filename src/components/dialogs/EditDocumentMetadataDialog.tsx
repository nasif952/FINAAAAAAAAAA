
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit2 } from 'lucide-react';

interface File {
  id: string;
  name: string;
  description?: string;
  file_type?: string;
}

interface EditDocumentMetadataDialogProps {
  file: File;
  onFileUpdated?: () => void;
}

export function EditDocumentMetadataDialog({ file, onFileUpdated }: EditDocumentMetadataDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState(file.name);
  const [description, setDescription] = useState(file.description || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMetadataMutation = useMutation({
    mutationFn: async () => {
      if (!fileName.trim()) {
        throw new Error("File name is required");
      }
      
      const { error } = await supabase
        .from('files')
        .update({
          name: fileName.trim(),
          description: description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', file.id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Metadata updated",
        description: "Document metadata has been updated successfully."
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      if (onFileUpdated) onFileUpdated();
    },
    onError: (error) => {
      toast({
        title: "Error updating metadata",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMetadataMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit2 size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Document Metadata</DialogTitle>
          <DialogDescription>
            Update the name and description of this document.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file-name" className="text-right">
                Name
              </Label>
              <Input
                id="file-name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="file-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Add a description for this document"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Type
              </Label>
              <div className="col-span-3 text-muted-foreground">
                {file.file_type || "Unknown"}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={updateMetadataMutation.isPending}
            >
              {updateMetadataMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
