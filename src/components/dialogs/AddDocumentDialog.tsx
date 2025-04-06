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
import { Upload, Loader2 } from 'lucide-react';

interface AddDocumentDialogProps {
  currentPath: string;
}

export function AddDocumentDialog({ currentPath }: AddDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 50MB)
      const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `File size exceeds the maximum allowed size of 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          variant: "destructive"
        });
        e.target.value = ''; // Reset the input
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf', 
        'image/png', 
        'image/jpeg', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        console.log('File type not allowed:', file.type);
        toast({
          title: "Invalid file type",
          description: "Only PDF, image, Excel, CSV, and Word documents are allowed.",
          variant: "destructive"
        });
        e.target.value = ''; // Reset the input
        return;
      }
      
      setSelectedFile(file);
      if (!fileName) {
        // Remove file extension from displayed name
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setFileName(nameWithoutExt);
      }
    }
  };

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error('No file selected');

      // Basic client-side validation (add more as needed)
      if (file.size > 50 * 1024 * 1024) { // 50MB limit example
        throw new Error('File size exceeds 50MB limit');
      }

      // Construct the storage path using currentPath
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = `${currentPath ? currentPath + '/' : ''}${fileName}`;

      console.log(`Uploading to path: ${filePath}`);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('data_room') // Target the correct bucket
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // *** Optional: Record metadata in 'files' table if still desired ***
      // If you still want to log uploads in the 'files' table (even though the Data tab doesn't use it directly):
      // const { data: fileData, error: dbError } = await supabase
      //   .from('files')
      //   .insert({ 
      //     name: file.name, // Original name
      //     storage_path: filePath, 
      //     file_size: file.size,
      //     file_type: file.type,
      //     folder_id: null, // Or derive if you map paths back to folder IDs elsewhere
      //     // user_id: ... // Add user ID if needed
      //    })
      //   .select();
      // if (dbError) { 
      //    console.warn('Failed to record file metadata in DB:', dbError); 
      //    // Decide if this should be a critical error or just a warning
      // }

      return filePath; // Return the path or other relevant data
    },
    onSuccess: (filePath) => {
      toast({ title: "File uploaded", description: `Successfully uploaded to ${filePath}` });
      setOpen(false);
      setSelectedFile(null);
      // Invalidate the storage query for the current path to refresh the list
      queryClient.invalidateQueries({ queryKey: ['storage', 'data_room', currentPath] });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex items-center gap-2">
          <Upload size={16} />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to the data room.
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
                placeholder="Document name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file-upload" className="text-right">
                File
              </Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
