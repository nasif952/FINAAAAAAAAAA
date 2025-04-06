// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
-------------------

// Fetch profiles
const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles:', data);
  }
};

---------------------

// Insert a new profile
const insertProfile = async (profile) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profile]);

  if (error) {
    console.error('Error inserting profile:', error);
  } else {
    console.log('Inserted profile:', data);
  }
};

// Example usage
insertProfile({
  id: 'unique-uuid',
  full_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  // other fields...
});

--------------------------
// Update a profile
const updateProfile = async (id, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Updated profile:', data);
  }
};

// Example usage
updateProfile('unique-uuid', { full_name: 'Jane Doe' });
--------------------


// Delete a profile
const deleteProfile = async (id) => {
  const { data, error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting profile:', error);
  } else {
    console.log('Deleted profile:', data);
  }
};

// Example usage
deleteProfile('unique-uuid');
------------------------
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);
----------------------


ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
-----------------------

// Call a Supabase function
const callFunction = async (functionName, params) => {
  const { data, error } = await supabase
    .rpc(functionName, params);

  if (error) {
    console.error('Error calling function:', error);
  } else {
    console.log('Function result:', data);
  }
};

// Example usage
callFunction('your_function_name', { param1: 'value1' });

------------------------

import { useEffect } from 'react';

const useProfilesSubscription = () => {
  useEffect(() => {
    const subscription = supabase
      .from('profiles')
      .on('INSERT', payload => {
        console.log('New profile added:', payload.new);
      })
      .on('UPDATE', payload => {
        console.log('Profile updated:', payload.new);
      })
      .on('DELETE', payload => {
        console.log('Profile deleted:', payload.old);
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, []);
};
------------------