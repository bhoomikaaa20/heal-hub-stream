
-- Role enum
CREATE TYPE public.app_role AS ENUM ('receptionist', 'doctor', 'pharmacist');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can read their own role
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read patients
CREATE POLICY "Authenticated users can read patients" ON public.patients
  FOR SELECT TO authenticated USING (true);

-- Only receptionists can insert patients
CREATE POLICY "Receptionists can insert patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'receptionist'));

-- Consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  prescription TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PRESCRIBED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read consultations" ON public.consultations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Doctors can insert consultations" ON public.consultations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'doctor'));

-- Bills table
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bills" ON public.bills
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Pharmacists can insert bills" ON public.bills
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'pharmacist'));

-- Pharmacists can update patient status
CREATE POLICY "Pharmacists can update patient status" ON public.patients
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'pharmacist'));

-- Doctors can update patient status  
CREATE POLICY "Doctors can update patient status" ON public.patients
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'doctor'));

-- Sequence for patient IDs
CREATE SEQUENCE public.patient_id_seq START 1001;

CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
    NEW.patient_id := 'P' || LPAD(nextval('public.patient_id_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_patient_id
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.generate_patient_id();
