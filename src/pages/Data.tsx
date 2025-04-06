import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  FolderOpen,
  ChevronRight,
  File,
  Trash2,
  Download,
  Search,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddDocumentDialog } from '@/components/dialogs/AddDocumentDialog';
import { CreateFolderDialog } from '@/components/dialogs/CreateFolderDialog';
// Removed EditDocumentMetadataDialog import as it's not directly used in the main view
// Removed Badge import as it's not currently used

// Type for items listed from Supabase Storage
interface StorageItem {
  name: string;
  id: string | null; // Folders might have null id
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: Record<string, any> | null; // More flexible metadata type
}

// Type for displaying items in the table
interface DisplayItem {
  name: string;
  isFolder: boolean;
  id: string; // Use name as ID for folders, storage ID for files
  path: string; // Full path within the bucket
  sizeDisplay: string;
  lastModified: string;
}

// --- Helper Functions ---

// Moved formatBytes function definition higher up
const formatBytes = (bytes?: number, decimals = 2): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function Data() { // Renamed component to Data
  const [currentPath, setCurrentPath] = useState<string>(''); // Store current path string
  const [folderPath, setFolderPath] = useState<{ name: string }[]>([{ name: 'Root' }]); // Path parts for breadcrumbs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // Store selected item paths
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Data Fetching from Storage ---

  const { data: storageItems, isLoading: storageLoading, error: storageError } = useQuery({
    queryKey: ['storage', 'data_room', currentPath], // Query key based on bucket and path
    queryFn: async () => {
      console.log(`Fetching from storage path: '${currentPath}'`);
      const { data, error } = await supabase.storage
        .from('data_room')
        .list(currentPath, {
          limit: 500, // Adjust limit as needed
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        console.error('Error listing storage files:', error);
        // Handle specific errors like path not found gracefully if needed
        throw new Error(`Failed to load files: ${error.message}`);
      }
      console.log('Storage items fetched:', data);
      // Use type assertion if confident about the structure, otherwise keep interfaces aligned
      return data as StorageItem[]; // Casting to StorageItem[]
    },
    retry: 1,
  });

  // Process storage items for display and filter by search query
  const displayItems = storageItems
    ?.map((item): DisplayItem => {
      const isFolder = item.id === null; // Supabase list() returns null id for folders
      const name = item.name;
      const path = `${currentPath ? currentPath + '/' : ''}${name}`;
      return {
        name: name,
        isFolder: isFolder,
        id: isFolder ? path : item.id, // Use path for folder ID, storage ID for file
        path: path,
        sizeDisplay: isFolder ? '-' : formatBytes(item.metadata?.size),
        lastModified: item.metadata?.lastModified ? new Date(item.metadata.lastModified).toLocaleDateString() : '-',
      };
    })
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) // Client-side search
    // Separate folders and files, then sort folders first, then files
    .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1; // Folders first
        if (!a.isFolder && b.isFolder) return 1; // Files after folders
        return a.name.localeCompare(b.name); // Sort alphabetically within type
    });


  // --- Error Handling ---

  useEffect(() => {
    if (storageError) {
      toast({
        title: "Error loading files",
        description: storageError instanceof Error ? storageError.message : "Failed to load files from storage",
        variant: "destructive"
      });
    }
  }, [storageError, toast]);


  // --- Mutations ---

  // Delete selected items (folders and files from storage)
  const deleteItemsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItems.length) return;

      const pathsToDelete = selectedItems;
      console.log('Attempting to delete paths:', pathsToDelete);

      // Use Storage API to remove files/folders (prefixes)
      const { data, error } = await supabase.storage
        .from('data_room')
        .remove(pathsToDelete);

      if (error) {
        console.error('Error deleting items from storage:', error);
        throw new Error(`Failed to delete: ${error.message}`);
      }

      console.log('Storage deletion result:', data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Items deleted",
        description: `${selectedItems.length} item(s) have been deleted from storage.`
      });
      setSelectedItems([]); // Clear selection
      // Invalidate storage query to refetch data
      queryClient.invalidateQueries({ queryKey: ['storage', 'data_room', currentPath] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting items",
        description: error instanceof Error ? error.message : "An unknown error occurred during deletion.",
        variant: "destructive"
      });
    }
  });

  // --- Other Helper Functions ---
  // formatBytes was moved higher

  // Navigate into a folder or back up the path using storage paths
  const navigateToFolder = (folderName: string) => {
    const newPath = `${currentPath ? currentPath + '/' : ''}${folderName}`;
    setCurrentPath(newPath);
    setFolderPath([...folderPath, { name: folderName }]);
    setSearchQuery('');
    setSelectedItems([]);
  };

  const navigateBreadcrumb = (index: number) => {
    const newPathParts = folderPath.slice(1, index + 1).map(f => f.name);
    setCurrentPath(newPathParts.join('/'));
    setFolderPath(folderPath.slice(0, index + 1));
    setSearchQuery('');
    setSelectedItems([]);
  };

  // Download a file from storage using its path
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      console.log(`Downloading: ${filePath}`);
      const { data, error } = await supabase.storage
        .from('data_room')
        .download(filePath);

      if (error) throw error;
      if (!data) throw new Error("File data is empty");

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName; // Use the actual file name
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({ title: "Download started", description: `Downloading ${fileName}` });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Could not download the file.",
        variant: "destructive"
      });
    }
  };

  // Toggle selection state for an item using its path
  const toggleItemSelection = (itemPath: string) => {
    setSelectedItems(prev =>
      prev.includes(itemPath) ? prev.filter(p => p !== itemPath) : [...prev, itemPath]
    );
  };

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // Client-side filtering happens in displayItems calculation
  };

  // Trigger search (client-side, no server action needed)
  const triggerSearch = () => {
    // No explicit action needed as filtering is done client-side
    console.log('Filtering items with query:', searchQuery);
  };


  const isLoading = storageLoading || deleteItemsMutation.isPending;

  // --- UI Rendering ---

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 animate-fade-in">
       {/* Header */}
       <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Data Room</h1>
          <p className="text-muted-foreground">Manage your company documents securely.</p>
        </div>
        <div className="flex space-x-2">
           {/* Pass currentPath to dialogs */}
           <AddDocumentDialog currentPath={currentPath} />
           <CreateFolderDialog currentPath={currentPath} />
        </div>
      </div>

      {/* Actions Bar (Search & Delete) */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
         {/* Breadcrumbs */}
         <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap py-1">
            {folderPath.map((folder, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight size={16} className="mx-1" />}
                <button
                  onClick={() => navigateBreadcrumb(index)}
                  className={`hover:text-primary ${index === folderPath.length - 1 ? 'font-medium text-foreground' : ''}`}
                  disabled={isLoading}
                >
                  {index === 0 && <FolderOpen size={16} className="inline mr-1" />}
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

         <div className="flex w-full sm:w-auto items-center space-x-2">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                className="pl-8 w-full"
                disabled={isLoading}
              />
            </div>
             {/* Delete Button */}
             {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteItemsMutation.mutate()}
                disabled={isLoading || deleteItemsMutation.isPending}
                className="flex items-center gap-1"
              >
                <Trash2 size={16} />
                Delete ({selectedItems.length})
              </Button>
            )}
         </div>
      </div>

      {/* File & Folder Table */}
      <Card className="overflow-hidden">
         <ScrollArea className="h-[60vh] relative"> {/* Adjust height as needed */}
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-10">
                     {/* Optional: Add a select-all checkbox here */}
                  </TableHead>
                  <TableHead>Name</TableHead>
                  {/* Removed Owner column */}
                  <TableHead className="hidden lg:table-cell">Date Modified</TableHead>
                  <TableHead className="hidden sm:table-cell">Size</TableHead>
                  <TableHead className="text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && !deleteItemsMutation.isPending ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : !displayItems?.length ? (
                   <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      {searchQuery ? `No results found for "${searchQuery}"` : "This folder is empty."}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Render Folders and Files */}
                    {displayItems?.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer group" onDoubleClick={() => item.isFolder && navigateToFolder(item.name)}>
                        <TableCell className="px-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.path)} // Select by path
                            onChange={(e) => { e.stopPropagation(); toggleItemSelection(item.path); }}
                            onClick={(e) => e.stopPropagation()} // Prevent row click trigger
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.isFolder ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigateToFolder(item.name); }}
                              className="flex items-center gap-2 hover:text-primary"
                              disabled={isLoading}
                            >
                              <FolderOpen size={18} />
                              <span>{item.name}</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <File size={18} className="text-muted-foreground" />
                              <span>{item.name}</span>
                            </div>
                          )}
                        </TableCell>
                        {/* Removed Owner Cell */}
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{item.lastModified}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{item.sizeDisplay}</TableCell>
                        <TableCell className="text-right px-2">
                          {!item.isFolder && (
                            <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); downloadFile(item.path, item.name); }}
                                disabled={isLoading}
                                title="Download"
                              >
                                <Download size={16} />
                              </Button>
                              {/* Add other file actions here if needed */}
                            </div>
                          )}
                           {/* Folder actions can go here if needed */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
         </ScrollArea>
      </Card>
    </div>
  );
}
