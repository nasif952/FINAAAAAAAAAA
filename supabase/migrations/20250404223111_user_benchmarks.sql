-- Create the user_benchmarks table to store custom benchmark values
CREATE TABLE IF NOT EXISTS public.user_benchmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid() -- Link benchmarks to user
);

-- Add RLS policies
ALTER TABLE public.user_benchmarks ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own benchmarks
CREATE POLICY "Users can view their own benchmarks"
  ON public.user_benchmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only allow users to insert their own benchmarks
CREATE POLICY "Users can insert their own benchmarks"
  ON public.user_benchmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own benchmarks
CREATE POLICY "Users can update their own benchmarks"
  ON public.user_benchmarks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only allow users to delete their own benchmarks
CREATE POLICY "Users can delete their own benchmarks"
  ON public.user_benchmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to update the updated_at field
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to update the updated_at field
CREATE TRIGGER update_user_benchmarks_updated_at
BEFORE UPDATE ON public.user_benchmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
