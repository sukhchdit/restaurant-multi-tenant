import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintBillItem {
  name: string;
  rate: number;
  qty: number;
}

export interface PrintBillData {
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

function doPrint(data: PrintBillData) {
  const balance = data.grandTotal - data.paidAmount;

  const rows = data.items
    .map(
      (item, i) =>
        `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd">${i + 1}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd">${item.name}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd;text-align:right">Rs. ${item.rate.toFixed(2)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd;text-align:center">${item.qty}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #ddd;text-align:right">Rs. ${(item.rate * item.qty).toFixed(2)}</td>
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
    <div class="row"><span>Sub Total</span><span>Rs. ${data.subTotal.toFixed(2)}</span></div>
    ${data.discountAmount > 0 ? `<div class="row"><span>Discount (${data.discountPercentage}%)</span><span>-Rs. ${data.discountAmount.toFixed(2)}</span></div>` : ''}
    ${data.gstAmount > 0 ? `<div class="row"><span>GST</span><span>Rs. ${data.gstAmount.toFixed(2)}</span></div>` : ''}
    ${data.vatAmount > 0 ? `<div class="row"><span>VAT</span><span>Rs. ${data.vatAmount.toFixed(2)}</span></div>` : ''}
    ${data.extraCharges > 0 ? `<div class="row"><span>Extra Charges</span><span>Rs. ${data.extraCharges.toFixed(2)}</span></div>` : ''}
    <div class="row grand"><span>Grand Total</span><span>Rs. ${data.grandTotal.toFixed(2)}</span></div>
    <div class="row"><span>Paid</span><span>Rs. ${data.paidAmount.toFixed(2)}</span></div>
    ${balance > 0 ? `<div class="row" style="color:#e11d48"><span>Balance Due</span><span>Rs. ${balance.toFixed(2)}</span></div>` : ''}
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

export function BillPreviewDialog({
  data,
  open,
  onOpenChange,
}: {
  data: PrintBillData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!data) return null;

  const balance = data.grandTotal - data.paidAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bill Preview</DialogTitle>
        </DialogHeader>

        <div className="font-sans text-sm space-y-3 border border-border rounded-lg p-4 bg-white dark:bg-zinc-950">
          <div className="text-center">
            <h3 className="text-lg font-bold">Restaurant</h3>
            <p className="text-xs text-muted-foreground">{data.orderNumber} &bull; {data.date}</p>
          </div>

          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold">{data.customerName || 'Guest'}</span>
            </div>
            {data.tableNumber && (
              <div className="flex justify-between">
                <span>Table:</span>
                <span className="font-bold">{data.tableNumber}</span>
              </div>
            )}
            {data.waiterName && (
              <div className="flex justify-between">
                <span>Waiter:</span>
                <span className="font-bold">{data.waiterName}</span>
              </div>
            )}
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black dark:border-white">
                <th className="text-left py-1 px-1">#</th>
                <th className="text-left py-1 px-1">Product</th>
                <th className="text-right py-1 px-1">Rate</th>
                <th className="text-center py-1 px-1">Qty</th>
                <th className="text-right py-1 px-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-1 px-1">{i + 1}</td>
                  <td className="py-1 px-1">{item.name}</td>
                  <td className="py-1 px-1 text-right">Rs. {item.rate.toFixed(2)}</td>
                  <td className="py-1 px-1 text-center">{item.qty}</td>
                  <td className="py-1 px-1 text-right">Rs. {(item.rate * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Sub Total</span>
              <span>Rs. {data.subTotal.toFixed(2)}</span>
            </div>
            {data.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount ({data.discountPercentage}%)</span>
                <span>-Rs. {data.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {data.gstAmount > 0 && (
              <div className="flex justify-between">
                <span>GST</span>
                <span>Rs. {data.gstAmount.toFixed(2)}</span>
              </div>
            )}
            {data.vatAmount > 0 && (
              <div className="flex justify-between">
                <span>VAT</span>
                <span>Rs. {data.vatAmount.toFixed(2)}</span>
              </div>
            )}
            {data.extraCharges > 0 && (
              <div className="flex justify-between">
                <span>Extra Charges</span>
                <span>Rs. {data.extraCharges.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t-2 border-black dark:border-white pt-1 mt-1">
              <span>Grand Total</span>
              <span>Rs. {data.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid</span>
              <span>Rs. {data.paidAmount.toFixed(2)}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Balance Due</span>
                <span>Rs. {balance.toFixed(2)}</span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground pt-2">Thank you for dining with us!</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => { doPrint(data); onOpenChange(false); }}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Keep the old function for backward compatibility (used in view dialog)
export function printBill(data: PrintBillData) {
  doPrint(data);
}
