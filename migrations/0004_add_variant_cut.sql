-- Adds a "cut" (szabás) to product variants: ferfi / noi / unisex, defaulting
-- to unisex. This needs a table rebuild rather than a plain ALTER TABLE ADD
-- COLUMN, because the UNIQUE(product_id, size) constraint has to become
-- UNIQUE(product_id, size, cut) so the same size can exist once per cut
-- (e.g. "Férfi M" and "Női M" as separate, separately-stocked variants).

CREATE TABLE product_variants_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL,
    cut TEXT NOT NULL DEFAULT 'unisex' CHECK (cut IN ('ferfi', 'noi', 'unisex')),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku TEXT UNIQUE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    UNIQUE(product_id, size, cut)
);

INSERT INTO product_variants_new (id, product_id, size, cut, stock, sku)
SELECT id, product_id, size, 'unisex', stock, sku FROM product_variants;

DROP TABLE product_variants;

ALTER TABLE product_variants_new RENAME TO product_variants;
