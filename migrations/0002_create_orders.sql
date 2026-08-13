CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,

    shipping_postal_code TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_street_address TEXT NOT NULL,
    shipping_note TEXT,

    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'HUF',

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),

    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TRIGGER trg_orders_updated_at
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_variant_id INTEGER,

    product_name TEXT NOT NULL,
    variant_size TEXT NOT NULL,
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
