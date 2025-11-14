import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportSalesReportToExcel = (reportData, dateRange) => {
  if (!reportData || !reportData.orders) return;

  const data = reportData.orders.map((order) => ({
    'رقم الطلب': order.order_number,
    'التاريخ': new Date(order.created_at).toLocaleDateString('ar-EG'),
    'العميل': order.customer_name || '-',
    'النوع': order.order_type === 'in-store' ? 'داخلي' : 'أونلاين',
    'الحالة': order.status,
    'المجموع الفرعي': parseFloat(order.subtotal).toFixed(2),
    'الخصم': parseFloat(order.discount_amount).toFixed(2),
    'الإجمالي': parseFloat(order.total).toFixed(2),
    'الربح': parseFloat(order.profit).toFixed(2),
  }));

  // Add summary row
  data.push({});
  data.push({
    'رقم الطلب': 'الإجمالي',
    'المجموع الفرعي': '',
    'الخصم': '',
    'الإجمالي': parseFloat(reportData.summary?.totalSales || 0).toFixed(2),
    'الربح': parseFloat(reportData.summary?.totalProfit || 0).toFixed(2),
  });

  const dateStr = dateRange.start_date && dateRange.end_date
    ? `_${dateRange.start_date}_${dateRange.end_date}`
    : '';

  exportToExcel(data, `تقرير_المبيعات${dateStr}`, 'المبيعات');
};

export const exportProductsReportToExcel = (reportData, dateRange) => {
  if (!reportData || reportData.length === 0) return;

  const data = reportData.map((product) => ({
    'المنتج': product.product_name,
    'الكمية المباعة': product.total_sold,
    'إجمالي الإيرادات': parseFloat(product.total_revenue).toFixed(2),
    'التكلفة الإجمالية': parseFloat(product.total_cost).toFixed(2),
    'الربح': parseFloat(product.total_profit).toFixed(2),
  }));

  const dateStr = dateRange.start_date && dateRange.end_date
    ? `_${dateRange.start_date}_${dateRange.end_date}`
    : '';

  exportToExcel(data, `تقرير_المنتجات${dateStr}`, 'المنتجات');
};

export const exportPurchasesReportToExcel = (reportData, dateRange) => {
  if (!reportData || reportData.length === 0) return;

  const data = reportData.map((purchase) => ({
    'التاريخ': new Date(purchase.purchase_date).toLocaleDateString('ar-EG'),
    'المورد': purchase.supplier_name,
    'الصنف': purchase.item_description,
    'الكمية': purchase.quantity,
    'سعر الوحدة': parseFloat(purchase.unit_price).toFixed(2),
    'الإجمالي': parseFloat(purchase.total_amount).toFixed(2),
    'ملاحظات': purchase.notes || '',
  }));

  // Add summary row
  const total = reportData.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
  data.push({});
  data.push({
    'التاريخ': 'الإجمالي',
    'الإجمالي': total.toFixed(2),
  });

  const dateStr = dateRange.start_date && dateRange.end_date
    ? `_${dateRange.start_date}_${dateRange.end_date}`
    : '';

  exportToExcel(data, `تقرير_المشتريات${dateStr}`, 'المشتريات');
};

export const exportProfitReportToExcel = (reportData, dateRange) => {
  if (!reportData) return;

  const data = [
    { 'البند': 'إجمالي الإيرادات', 'القيمة': parseFloat(reportData.totalRevenue || 0).toFixed(2) },
    { 'البند': 'التكلفة الإجمالية', 'القيمة': parseFloat(reportData.totalCost || 0).toFixed(2) },
    { 'البند': 'الربح الإجمالي (قبل المصروفات)', 'القيمة': parseFloat(reportData.grossProfit || 0).toFixed(2) },
    { 'البند': '', 'القيمة': '' },
    { 'البند': 'المصروفات', 'القيمة': parseFloat(reportData.totalExpenses || 0).toFixed(2) },
    { 'البند': 'المشتريات', 'القيمة': parseFloat(reportData.totalPurchases || 0).toFixed(2) },
    { 'البند': '', 'القيمة': '' },
    { 'البند': 'صافي الربح', 'القيمة': parseFloat(reportData.netProfit || 0).toFixed(2) },
  ];

  const dateStr = dateRange.start_date && dateRange.end_date
    ? `_${dateRange.start_date}_${dateRange.end_date}`
    : '';

  exportToExcel(data, `تقرير_صافي_الربح${dateStr}`, 'صافي الربح');
};
