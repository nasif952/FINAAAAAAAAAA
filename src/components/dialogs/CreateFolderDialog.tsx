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
import { FolderPlus } from 'lucide-react';

interface CreateFolderDialogProps {
  currentPath: string;
}

export function CreateFolderDialog({ currentPath }: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      if (!folderName.trim()) throw new Error('Folder name cannot be empty');

      // **Important**: Creating a "folder" in Supabase Storage means uploading
      // a placeholder file (like a .keep file) to that prefix.
      // The `list()` method will then show the prefix as if it were a folder.

      const sanitizedName = folderName.trim().replace(/[/\?%*:|"<>]/g, '-'); // Basic sanitization
      const folderPath = `${currentPath ? currentPath + '/' : ''}${sanitizedName}`;
      const placeholderFilePath = `${folderPath}/.placeholder`; // Standard practice

      console.log(`Attempting to create folder at path: ${folderPath} by creating placeholder: ${placeholderFilePath}`);

      // Upload a dummy file (e.g., empty file) to create the folder structure
      const { error: uploadError } = await supabase.storage
        .from('data_room')
        .upload(placeholderFilePath, new Blob(['']), { contentType: 'text/plain' });

      if (uploadError && !uploadError.message.includes('The resource already exists')) { // Ignore if folder already exists
        console.error('Error creating folder placeholder:', uploadError);
        throw new Error(`Failed to create folder: ${uploadError.message}`);
      }
      
      // ** Optional: Record folder in 'folders' table if still desired **
      // If you still want to log folder creation in the 'folders' table:
      // const { data: authData } = await supabase.auth.getUser();
      // const { error: dbError } = await supabase
      //   .from('folders')
      //   .insert({ 
      //       name: sanitizedName, 
      //       parent_id: parentId, // This requires mapping currentPath back to a parentId if needed
      //       owner: authData.user?.email || 'Unknown' 
      //     });
      // if (dbError) {
      //   console.warn('Failed to record folder in DB:', dbError);
      //   // Decide if this is critical
      // }

      return folderPath;
    },
    onSuccess: (folderPath) => {
      toast({ title: "Folder created", description: `Folder '${folderPath.split('/').pop()}' created successfully.` });
      setOpen(false);
      setFolderName('');
      // Invalidate the storage query for the current path to refresh the list
      queryClient.invalidateQueries({ queryKey: ['storage', 'data_room', currentPath] });
    },
    onError: (error) => {
      console.error('Folder creation error:', error);
      toast({
        title: "Error creating folder",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFolderMutation.mutate(folderName);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FolderPlus size={16} />
          Create Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Create a new folder in the data room.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Name
              </Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="col-span-3"
                placeholder="Folder name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
