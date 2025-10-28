-- Add address_id column to orders table to link orders to saved addresses
-- This allows tracking which saved address was used for an order

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES user_addresses(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN orders.address_id IS 'Optional reference to user_addresses table. If NULL, customer_address contains free-form address text.';
