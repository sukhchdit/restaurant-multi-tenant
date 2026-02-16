interface PrintBillItem {
  name: string;
  rate: number;
  qty: number;
}

interface PrintBillData {
  orderNumber: string;
  date: string;
  customerName: string;
  tableNumber?: string;
  waiterName?: string;
  items: PrintBillItem[];
  subTotal: number;
  discountPercentage: number;
  discountAmount: number;
  gstAmount: number;
  vatAmount: number;
  extraCharges: number;
  grandTotal: number;
  paidAmount: number;
}

export function printBill(data: PrintBillData) {
  const balance = data.grandTotal - data.paidAmount;

  const rows = data.items
    .map(
      (item, i) =>
        `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd">${i + 1}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd">${item.name}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd;text-align:right">${item.rate.toFixed(2)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd;text-align:center">${item.qty}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd;text-align:right">${(item.rate * item.qty).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Bill - ${data.orderNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #333; max-width: 400px; margin: 0 auto; }
    h2 { text-align: center; margin-bottom: 4px; }
    .meta { text-align: center; font-size: 13px; color: #666; margin-bottom: 16px; }
    .info { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th { padding: 6px 8px; border-bottom: 2px solid #333; text-align: left; }
    th:nth-child(3), th:nth-child(5) { text-align: right; }
    th:nth-child(4) { text-align: center; }
    .totals { margin-top: 8px; font-size: 13px; }
    .totals .row { display: flex; justify-content: space-between; padding: 3px 0; }
    .totals .grand { font-weight: bold; font-size: 16px; border-top: 2px solid #333; padding-top: 6px; margin-top: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h2>Restaurant</h2>
  <div class="meta">${data.orderNumber} &bull; ${data.date}</div>
  <div class="info"><span>Customer:</span><span>${data.customerName || 'Guest'}</span></div>
  ${data.tableNumber ? `<div class="info"><span>Table:</span><span>${data.tableNumber}</span></div>` : ''}
  ${data.waiterName ? `<div class="info"><span>Waiter:</span><span>${data.waiterName}</span></div>` : ''}
  <table>
    <thead>
      <tr><th>#</th><th>Product</th><th>Rate</th><th>Qty</th><th>Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Sub Total</span><span>${data.subTotal.toFixed(2)}</span></div>
    ${data.discountAmount > 0 ? `<div class="row"><span>Discount (${data.discountPercentage}%)</span><span>-${data.discountAmount.toFixed(2)}</span></div>` : ''}
    ${data.gstAmount > 0 ? `<div class="row"><span>GST</span><span>${data.gstAmount.toFixed(2)}</span></div>` : ''}
    ${data.vatAmount > 0 ? `<div class="row"><span>VAT</span><span>${data.vatAmount.toFixed(2)}</span></div>` : ''}
    ${data.extraCharges > 0 ? `<div class="row"><span>Extra Charges</span><span>${data.extraCharges.toFixed(2)}</span></div>` : ''}
    <div class="row grand"><span>Grand Total</span><span>${data.grandTotal.toFixed(2)}</span></div>
    <div class="row"><span>Paid</span><span>${data.paidAmount.toFixed(2)}</span></div>
    ${balance > 0 ? `<div class="row" style="color:#e11d48"><span>Balance Due</span><span>${balance.toFixed(2)}</span></div>` : ''}
  </div>
  <div class="footer">Thank you for dining with us!</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=600');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
