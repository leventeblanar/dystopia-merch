-- Snapshots the variant's cut (szabás) onto each order item at purchase
-- time, mirroring variant_size, so order history/emails stay accurate even
-- if the variant is edited or deleted later.

ALTER TABLE order_items
ADD COLUMN variant_cut TEXT NOT NULL DEFAULT 'unisex'
    CHECK (variant_cut IN ('ferfi', 'noi', 'unisex'));
