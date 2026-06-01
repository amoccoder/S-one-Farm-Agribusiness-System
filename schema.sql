-- S-ONE FARM ERP - Initial Database Schema
-- S-ONE FARM ERP - Enterprise SaaS Schema
-- Phase 2: Database Design
-- This schema is designed for a multi-tenant, microservices-oriented architecture.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Core Tenancy and User Management (Auth Service)
-- =============================================================================

-- Organizations Table: Represents a single tenant (a customer's company/farm business).
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- For soft deletes
);

-- Users Table: Stores global user account information. A user can belong to multiple organizations.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Roles Table: Defines a static list of roles available in the system.
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- User Organization Roles Table: Junction table to assign roles to users within a specific organization.
CREATE TABLE user_organization_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, organization_id, role_id)
);

-- Audit Logs Table: Tracks all significant actions for compliance and security.
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_entity VARCHAR(100),
    target_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Farm and Crop Management (Farm & Crop Services)
-- =============================================================================

CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_address TEXT,
    location_coordinates JSONB, -- For GeoJSON
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    area_hectares DECIMAL(10, 4),
    boundary_polygon JSONB, -- For GeoJSON
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, -- Some crops can be tenant-specific
    name VARCHAR(255) NOT NULL,
    variety VARCHAR(255),
    scientific_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE plantings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    status VARCHAR(50) DEFAULT 'Active', -- e.g., 'Active', 'Harvested', 'Failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE harvests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    planting_id UUID NOT NULL REFERENCES plantings(id) ON DELETE CASCADE,
    harvest_date DATE NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- e.g., 'kg', 'tonnes', 'bushels'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- Livestock Management (Livestock Service)
-- =============================================================================

CREATE TABLE livestock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    tag_id VARCHAR(100),
    species VARCHAR(100),
    breed VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Active', -- e.g., 'Active', 'Sold', 'Deceased'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE livestock_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    livestock_id UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'Vaccination', 'Treatment', 'Checkup'
    event_date DATE NOT NULL,
    description TEXT,
    vet_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE feed_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    livestock_id UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
    -- inventory_item_id will be a foreign key to the inventory table
    feed_details JSONB, -- e.g., { "item_id": "...", "quantity": 5, "unit": "kg" }
    log_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- Equipment and Inventory (Inventory Service)
-- =============================================================================

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    purchase_date DATE,
    status VARCHAR(50) DEFAULT 'Operational', -- 'Operational', 'In Repair', 'Decommissioned'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10, 2),
    performed_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Storage Locations (Warehouses, Silos, Cold Rooms)
CREATE TABLE storage_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- e.g., 'Silo', 'Cold Storage', 'Dry Storage'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Master catalog of all items that can be stored in inventory
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku VARCHAR(100), -- Stock Keeping Unit
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'Feed', 'Medicine', 'Seed', 'Fertilizer', 'Spare Part'
    unit_of_measure VARCHAR(20) NOT NULL, -- e.g., 'kg', 'litre', 'unit'
    low_stock_threshold DECIMAL(12, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, sku)
);

-- Real-time snapshot of stock levels
CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES storage_locations(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 4) NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, item_id, location_id)
);

-- Immutable log of all stock movements
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES storage_locations(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'Purchase', 'Consumption', 'Sale', 'Adjustment'
    quantity_change DECIMAL(12, 4) NOT NULL, -- Positive for additions, negative for removals
    related_entity_id UUID, -- e.g., purchase_order_id, livestock_id, harvest_id
    transaction_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- Financial Management (Financial Service)
-- =============================================================================

-- Purchase Orders (Part of Inventory Service workflow)
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    order_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Ordered', 'Partially Received', 'Completed'
    total_amount DECIMAL(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    ordered_quantity DECIMAL(12, 4) NOT NULL,
    received_quantity DECIMAL(12, 4) DEFAULT 0,
    unit_price DECIMAL(12, 2) NOT NULL
);

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sale_date DATE NOT NULL,
    item_details JSONB,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'Profit & Loss', 'Cash Flow'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    report_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- IoT and Notifications (IoT & Notification Services)
-- =============================================================================

CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    device_type VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    install_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE sensor_data (
    id BIGSERIAL PRIMARY KEY, -- Use BIGSERIAL for high-volume inserts
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    data JSONB NOT NULL, -- Flexible schema for different sensor types
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trigger_source VARCHAR(255),
    severity VARCHAR(20) DEFAULT 'Info', -- 'Info', 'Warning', 'Critical'
    status VARCHAR(20) DEFAULT 'New', -- 'New', 'Acknowledged', 'Resolved'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL, -- 'Email', 'SMS', 'Push'
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Sent', 'Failed'
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- Triggers and Indexes
-- =============================================================================

-- Trigger function to automatically update the 'updated_at' timestamp on row modification
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with an 'updated_at' column
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' AND table_schema = 'public')
    LOOP
        EXECUTE format('CREATE TRIGGER set_timestamp BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();', t_name);
    END LOOP;
END;
$$;

-- Insert initial roles
INSERT INTO roles (name, description) VALUES
('Super Admin', 'System-wide administrator.'),
('Farm Owner', 'Top-level owner of one or more farms within an organization.'),
('Farm Manager', 'Manages day-to-day operations of a specific farm.'),
('Worker', 'General staff with task-based access.'),
('Accountant', 'Manages financial records and reporting.'),
('Vet', 'Manages livestock health records.');

-- Add indexes for performance on foreign keys and frequently queried columns
CREATE INDEX ON users (email);
CREATE INDEX ON organizations (deleted_at);
CREATE INDEX ON farms (organization_id);
CREATE INDEX ON fields (farm_id);
CREATE INDEX ON plantings (field_id, crop_id);
CREATE INDEX ON harvests (planting_id);
CREATE INDEX ON livestock (farm_id, species);
CREATE INDEX ON livestock_health (livestock_id);
CREATE INDEX ON feed_logs (livestock_id);
CREATE INDEX ON equipment (farm_id);
CREATE INDEX ON maintenance_logs (equipment_id);
CREATE INDEX ON storage_locations (farm_id);
CREATE INDEX ON inventory_items (organization_id, category);
CREATE INDEX ON inventory_stock (item_id, location_id);
CREATE INDEX ON inventory_transactions (item_id, location_id);
CREATE INDEX ON purchase_orders (organization_id, supplier_id);
CREATE INDEX ON expenses (organization_id, category);
CREATE INDEX ON iot_devices (farm_id);
CREATE INDEX ON sensor_data (device_id, timestamp DESC);
CREATE INDEX ON alerts (organization_id, status);
CREATE INDEX ON notifications (user_id, status);

-- =============================================================================
-- Security (Phase 3 Additions)
-- =============================================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL, -- Hashed token or JWT signature
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX ON refresh_tokens (token);
CREATE INDEX ON refresh_tokens (user_id);