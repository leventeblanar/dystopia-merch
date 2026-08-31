-- Adds a "category" to products so the store can filter Póló vs Nem Póló
-- items (and only show size/cut filters for Póló). Backfills existing
-- products: anything with a sizeless variant ("Egyméretes") is clearly not
-- a t-shirt, everything else defaults to 'polo'.

ALTER TABLE products
ADD COLUMN category TEXT NOT NULL DEFAULT 'polo'
    CHECK (category IN ('polo', 'egyeb'));

UPDATE products
SET category = 'egyeb'
WHERE id IN (
    SELECT product_id FROM product_variants WHERE size = 'Egyméretes'
);
