-- Fix: Add supplier_id to unpaid_purchases view
-- This allows the frontend to properly link payments to suppliers

CREATE OR REPLACE VIEW unpaid_purchases AS
SELECT
    ip.id,
    ip.supplier_id,
    ip.invoice_number,
    ip.purchase_date,
    ip.due_date,
    s.name AS supplier_name,
    s.phone AS supplier_phone,
    ip.total_amount,
    ip.paid_amount,
    (ip.total_amount - ip.paid_amount) AS remaining_amount,
    ip.payment_status,
    DATEDIFF(CURDATE(), ip.due_date) AS days_overdue
FROM inventory_purchases ip
JOIN suppliers s ON ip.supplier_id = s.id
WHERE ip.payment_status IN ('unpaid', 'partial')
ORDER BY ip.due_date ASC;
