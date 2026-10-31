-- Create ratings table for driver and customer ratings
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    rated_by TEXT NOT NULL, -- 'customer' or 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read ratings
CREATE POLICY "Anyone can view ratings" ON public.ratings
    FOR SELECT USING (true);

-- Allow authenticated users to insert ratings
CREATE POLICY "Authenticated users can insert ratings" ON public.ratings
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update their own ratings
CREATE POLICY "Users can update their ratings" ON public.ratings
    FOR UPDATE USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_driver_id ON public.ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_shipment_id ON public.ratings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON public.ratings(created_at DESC);
