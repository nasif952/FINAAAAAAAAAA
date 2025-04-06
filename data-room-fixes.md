# Data Room Fixes - Troubleshooting Guide

## Key Issue: Storage Bucket Naming and Access

The Data Room functionality was failing due to several issues related to Supabase storage bucket configuration and naming inconsistencies.

### 1. Bucket Naming Convention

**Problem:** Inconsistent bucket naming with some code using `data-room` (with hyphen) and others using `data_room` (with underscore).

**Fix:** Standardized all references to use `data_room` with underscore:
- Changed in AddDocumentDialog.tsx
- Changed in DataRoom.tsx
- Updated route paths in SidebarNav.tsx and App.tsx
- Updated documentation references in project-docs.md

```typescript
// Correct usage:
const { data, error } = await supabase.storage
  .from('data_room')  // Use underscore, NOT hyphen
  .upload(filePath, file);
```

### 2. Row-Level Security Policy Issues

**Problem:** Error "new row violates row-level security policy" when attempting to create the bucket directly from client code.

**Fix:** Created a Supabase Edge Function to handle bucket creation with admin privileges.

```typescript
// supabase/functions/create-storage-bucket/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  // Initialize with service role key (admin access)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );
  
  // Create the bucket with proper configuration
  const { data, error } = await supabase.storage.createBucket('data_room', {
    public: false,
    fileSizeLimit: 52428800 // 50MB
  });
  
  // Return result
  return new Response(JSON.stringify({ success: !error, data, error }));
});
```

### 3. Folder Creation Fix

**Problem:** Error "TypeError: query.insert is not a function" due to incorrect chaining of Supabase query methods.

**Fix:** Modified CreateFolderDialog.tsx to use a single insert operation:

```typescript
// INCORRECT (before):
let query = supabase.from('folders').insert({...});
query = query.insert({...});  // This doesn't work!

// CORRECT (after):
const folderData = {
  name: sanitizedName,
  parent_id: parentId || null,
  owner: 'Current User'
};

const { data, error } = await supabase
  .from('folders')
  .insert(folderData)
  .select('id')
  .single();
```

### 4. File Upload Error Handling

**Problem:** Generic error messages when uploads failed, making debugging difficult.

**Fix:** Enhanced error handling with specific error messages:

```typescript
if (uploadError) {
  if (uploadError.message.includes('bucket') && uploadError.message.includes('not found')) {
    throw new Error("The storage bucket doesn't exist. Please contact administrator.");
  } else if (uploadError.message.includes('row-level security policy')) {
    throw new Error("You don't have permission to upload files.");
  } else {
    throw new Error(`File upload failed: ${uploadError.message}`);
  }
}
```

## Implementation Steps for Fixing Data Room

1. **Fix Bucket Naming**: Standardize on `data_room` (with underscore) throughout the codebase
2. **Create Edge Function**: Deploy a Supabase Edge Function with admin rights to create the bucket
3. **Update DataRoom Component**: Modify to call the Edge Function when needed
4. **Fix Insert Operations**: Use proper Supabase query patterns for database operations
5. **Improve Error Handling**: Add specific error messages for better debugging
6. **Update Route Paths**: Ensure route paths match the bucket naming convention

## Testing the Fix

1. Navigate to Data Room
2. Create a folder (should work without errors)
3. Upload a document (should successfully upload and appear in the list)
4. Download the uploaded document (should download correctly)

If any step fails, check the browser console for specific error messages. 