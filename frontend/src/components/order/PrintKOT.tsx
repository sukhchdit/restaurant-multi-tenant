interface PrintKOTItem {
  name: string;
  qty: number;
}

interface PrintKOTData {
  orderNumber: string;
  date: string;
  tableNumber?: string;
  waiterName?: string;
  items: PrintKOTItem[];
  specialNotes?: string;
}

export function printKOT(data: PrintKOTData) {
  const rows = data.items
    .map(
      (item, i) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px dashed #999">${i + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #999">${item.name}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #999;text-align:center;font-weight:bold;font-size:15px">${item.qty}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>KOT - ${data.orderNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; margin: 0; padding: 16px; color: #000; max-width: 320px; margin: 0 auto; }
    h2 { text-align: center; margin: 0 0 4px; font-size: 20px; letter-spacing: 2px; }
    .divider { border-top: 2px dashed #000; margin: 8px 0; }
    .info { font-size: 13px; margin-bottom: 2px; }
    .info span { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
    th { padding: 6px 8px; border-bottom: 2px solid #000; text-align: left; font-size: 13px; }
    th:nth-child(3) { text-align: center; }
    .notes { margin-top: 8px; padding: 8px; border: 1px dashed #999; font-size: 12px; }
    .notes strong { display: block; margin-bottom: 4px; }
    .footer { text-align: center; margin-top: 12px; font-size: 11px; color: #666; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h2>KOT</h2>
  <div style="text-align:center;font-size:12px;color:#666">Kitchen Order Ticket</div>
  <div class="divider"></div>
  <div class="info">Order: <span>${data.orderNumber}</span></div>
  <div class="info">Date: <span>${data.date}</span></div>
  ${data.tableNumber ? `<div class="info">Table: <span>${data.tableNumber}</span></div>` : ''}
  ${data.waiterName ? `<div class="info">Waiter: <span>${data.waiterName}</span></div>` : ''}
  <div class="divider"></div>
  <table>
    <thead>
      <tr><th>#</th><th>Item</th><th>Qty</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="divider"></div>
  ${data.specialNotes ? `<div class="notes"><strong>Notes:</strong>${data.specialNotes}</div>` : ''}
  <div class="footer">Printed: ${new Date().toLocaleString()}</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=360,height=500');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
