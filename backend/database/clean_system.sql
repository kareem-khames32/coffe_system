-- ====================================================================
-- سكريبت تنظيف قاعدة البيانات
-- Database Cleanup Script
-- ====================================================================
-- هذا السكريبت يقوم بحذف جميع البيانات من النظام عدا اليوزرات والإعدادات
-- This script deletes all data except users and settings
-- ====================================================================

-- تعطيل فحص المفاتيح الأجنبية مؤقتاً
-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================================
-- 1. حذف بيانات الطلبات / Delete Orders Data
-- ====================================================================

-- حذف تفاصيل الطلبات
-- Delete order items first (child table)
TRUNCATE TABLE order_items;

-- حذف سجل تعديلات الطلبات
-- Delete order edit history
TRUNCATE TABLE order_edit_history;

-- حذف الطلبات
-- Delete orders
TRUNCATE TABLE orders;

-- ====================================================================
-- 2. حذف بيانات المنتجات / Delete Products Data
-- ====================================================================

-- حذف المنتجات
-- Delete products
TRUNCATE TABLE products;

-- حذف الفئات (اختياري - يمكن إزالة التعليق للحذف)
-- Delete categories (optional - uncomment to delete)
-- TRUNCATE TABLE categories;

-- ====================================================================
-- 3. حذف البيانات المالية / Delete Financial Data
-- ====================================================================

-- حذف المصروفات
-- Delete expenses
TRUNCATE TABLE expenses;

-- حذف المشتريات
-- Delete purchases
TRUNCATE TABLE purchases;

-- ====================================================================
-- 4. حذف العروض والخصومات / Delete Offers and Discounts
-- ====================================================================

-- حذف العروض
-- Delete offers
TRUNCATE TABLE offers;

-- حذف الخصومات اليومية
-- Delete daily discounts
TRUNCATE TABLE daily_discounts;

-- ====================================================================
-- ملاحظة: الجداول التالية لن يتم حذفها
-- Note: The following tables will NOT be deleted:
-- ====================================================================
-- - users (اليوزرات)
-- - settings (الإعدادات)
-- - categories (الفئات - اختياري)

-- إعادة تفعيل فحص المفاتيح الأجنبية
-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- رسالة نجاح / Success Message
-- ====================================================================
SELECT 'تم تنظيف قاعدة البيانات بنجاح! / Database cleaned successfully!' AS Status;
SELECT 'تم الاحتفاظ بالمستخدمين والإعدادات / Users and settings were preserved' AS Note;
