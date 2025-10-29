-- ===================================================================
-- REMOVE FOOTER FROM NAVIGATION SYSTEM
-- ===================================================================
-- The footer is already managed comprehensively via the CMS Footer Editor,
-- so we're removing it from the navigation menu system to avoid duplication.
-- This migration:
-- 1. Deletes any menu items associated with the footer location
-- 2. Removes the footer location from menu_locations table
-- ===================================================================

-- Delete all menu items and their translations for footer location
-- (CASCADE will handle menu_item_translations)
DELETE FROM menu_items
WHERE location_id = (SELECT id FROM menu_locations WHERE code = 'footer');

-- Delete the footer location
DELETE FROM menu_locations WHERE code = 'footer';
