this is existing schema table :
-- Table: public.app_users
CREATE TABLE public.app_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NULL,
  user_type text NULL DEFAULT 'Team Member'::text,
  status text NULL DEFAULT 'Invited'::text,
  role text NULL DEFAULT 'User'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT app_users_pkey PRIMARY KEY (id),
  CONSTRAINT app_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT app_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Table: public.business_model
CREATE TABLE public.business_model (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  section text NOT NULL,
  content text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT business_model_pkey PRIMARY KEY (id),
  CONSTRAINT business_model_company_id_section_key UNIQUE (company_id, section),
  CONSTRAINT business_model_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Table: public.business_questions
CREATE TABLE public.business_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  problem_solving text NULL,
  solution text NULL,
  why_now text NULL,
  business_model text NULL,
  founding_team_gender text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT business_questions_pkey PRIMARY KEY (id),
  CONSTRAINT business_questions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Table: public.companies
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Company'::text,
  industry text NULL DEFAULT 'Business Support Services'::text,
  business_activity text NULL DEFAULT 'Legal Services'::text,
  founded_year integer NULL DEFAULT 2025,
  stage text NULL DEFAULT 'Growth'::text,
  total_employees integer NULL DEFAULT 20,
  last_revenue numeric NULL DEFAULT 1000,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  website_url text NULL,
  country text NULL,
  currency text NULL,
  sector text NULL,
  company_series text NULL,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);

-- Table: public.esops
CREATE TABLE public.esops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  total_shares integer NOT NULL,
  vesting_period text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT esops_pkey PRIMARY KEY (id)
);

-- Table: public.files
CREATE TABLE public.files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  folder_id uuid NULL,
  storage_path text NOT NULL,
  file_size text,
  file_type text,
  owner text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT files_pkey PRIMARY KEY (id),
  CONSTRAINT files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Table: public.folders
CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid NULL,
  owner text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT folders_pkey PRIMARY KEY (id),
  CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Table: public.funding_rounds
CREATE TABLE public.funding_rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date timestamp with time zone NULL DEFAULT now(),
  valuation numeric NULL DEFAULT 0,
  is_foundation boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT funding_rounds_pkey PRIMARY KEY (id)
);

-- Table: public.industry_benchmarks
CREATE TABLE public.industry_benchmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  metric text NOT NULL,
  value numeric NOT NULL,
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT industry_benchmarks_pkey PRIMARY KEY (id)
);

-- Table: public.investments
CREATE TABLE public.investments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shareholder_id uuid NULL,
  round_id uuid NULL,
  share_class_id uuid NULL,
  number_of_shares integer NOT NULL,
  share_price numeric NOT NULL,
  capital_invested numeric NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT investments_pkey PRIMARY KEY (id),
  CONSTRAINT investments_round_id_fkey FOREIGN KEY (round_id) REFERENCES funding_rounds(id) ON DELETE CASCADE,
  CONSTRAINT investments_share_class_id_fkey FOREIGN KEY (share_class_id) REFERENCES share_classes(id) ON DELETE CASCADE,
  CONSTRAINT investments_shareholder_id_fkey FOREIGN KEY (shareholder_id) REFERENCES shareholders(id) ON DELETE CASCADE
);

-- Table: public.loans
CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  interest_rate numeric NULL,
  term_months integer NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT loans_pkey PRIMARY KEY (id)
);

-- Table: public.performance_metrics
CREATE TABLE public.performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NULL,
  unit text NOT NULL,
  is_default boolean NULL DEFAULT false,
  is_custom boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT performance_metrics_pkey PRIMARY KEY (id)
);

-- Table: public.performance_values
CREATE TABLE public.performance_values (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  metric_id uuid NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  target numeric NULL,
  actual numeric NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT performance_values_pkey PRIMARY KEY (id),
  CONSTRAINT performance_values_metric_id_month_year_key UNIQUE (metric_id, month, year),
  CONSTRAINT performance_values_metric_id_fkey FOREIGN KEY (metric_id) REFERENCES performance_metrics(id) ON DELETE CASCADE
);

-- Table: public.pitch_deck_analyses
CREATE TABLE public.pitch_deck_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_id uuid NULL,
  analysis jsonb NULL,
  title text NULL,
  upload_date timestamp with time zone NULL DEFAULT now(),
  status text NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT pitch_deck_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT pitch_deck_analyses_file_id_fkey FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Table: public.pitch_deck_metrics
CREATE TABLE public.pitch_deck_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  analysis_id uuid NULL,
  metric_name text NOT NULL,
  score integer NULL,
  feedback text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT pitch_deck_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT pitch_deck_metrics_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES pitch_deck_analyses(id)
);

-- Table: public.profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NULL,
  avatar_url text NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  last_name text NULL,
  designation text NULL,
  phone text NULL,
  country_code text NULL,
  face_auth_enabled boolean NULL DEFAULT false,
  face_data text NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: public.questionnaire_questions
CREATE TABLE public.questionnaire_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  questionnaire_id uuid NULL,
  question_number text NOT NULL,
  question text NOT NULL,
  response text NULL,
  response_type text NULL DEFAULT 'text'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  options text[] NULL,
  CONSTRAINT questionnaire_questions_pkey PRIMARY KEY (id),
  CONSTRAINT questionnaire_questions_questionnaire_id_fkey FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE
);

-- Table: public.questionnaires
CREATE TABLE public.questionnaires (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  valuation_id uuid NULL,
  step text NOT NULL,
  step_number integer NOT NULL,
  title text NOT NULL,
  status text NULL DEFAULT 'incomplete'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT questionnaires_pkey PRIMARY KEY (id),
  CONSTRAINT questionnaires_valuation_id_fkey FOREIGN KEY (valuation_id) REFERENCES valuations(id) ON DELETE CASCADE
);

-- Table: public.round_summaries
CREATE TABLE public.round_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  round_id uuid NULL,
  total_shares integer NOT NULL DEFAULT 0,
  total_capital numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT round_summaries_pkey PRIMARY KEY (id),
  CONSTRAINT round_summaries_round_id_fkey FOREIGN KEY (round_id) REFERENCES funding_rounds(id) ON DELETE CASCADE
);

-- Table: public.share_classes
CREATE TABLE public.share_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rights text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  voting_rights boolean NULL DEFAULT false,
  preferred_dividend numeric NULL DEFAULT 0,
  CONSTRAINT share_classes_pkey PRIMARY KEY (id)
);

-- Table: public.shareholder_investments (View)
CREATE VIEW public.shareholder_investments AS 
SELECT s.id,
       s.name,
       s.contact,
       count(i.id) AS total_investments,
       sum(i.number_of_shares) AS total_shares,
       sum(i.capital_invested) AS total_invested
FROM shareholders s
LEFT JOIN investments i ON s.id = i.shareholder_id
GROUP BY s.id, s.name, s.contact;

-- Table: public.shareholders
CREATE TABLE public.shareholders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT shareholders_pkey PRIMARY KEY (id)
);

-- Table: public.social_media
CREATE TABLE public.social_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  linkedin text NULL,
  instagram text NULL,
  crunchbase text NULL,
  twitter text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT social_media_pkey PRIMARY KEY (id),
  CONSTRAINT social_media_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Table: public.startup_scores
CREATE TABLE public.startup_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  total_score numeric NOT NULL DEFAULT 0,
  growth_score numeric NOT NULL DEFAULT 0,
  team_score numeric NOT NULL DEFAULT 0,
  finance_score numeric NOT NULL DEFAULT 0,
  market_score numeric NOT NULL DEFAULT 0,
  product_score numeric NOT NULL DEFAULT 0,
  calculation_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT startup_scores_pkey PRIMARY KEY (id),
  CONSTRAINT startup_scores_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Table: public.valuations
CREATE TABLE public.valuations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  initial_estimate numeric NULL DEFAULT 61000,
  pre_money_valuation numeric NULL DEFAULT 0,
  investment numeric NULL DEFAULT 0,
  post_money_valuation numeric NULL DEFAULT 0,
  selected_valuation numeric NULL DEFAULT 54000,
  valuation_min numeric NULL DEFAULT 44000,
  valuation_max numeric NULL DEFAULT 64000,
  funds_raised numeric NULL DEFAULT 0,
  last_year_ebitda numeric NULL DEFAULT 0,
  industry_multiple numeric NULL DEFAULT 8.067476,
  annual_roi numeric NULL DEFAULT 3.2,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT valuations_pkey PRIMARY KEY (id),
  CONSTRAINT valuations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);