import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer } from 'lucide-react';
import type { KitchenOrderTicket } from '@/types/order.types';

interface PrintKOTItem {
  name: string;
  qty: number;
}

export interface PrintKOTData {
  orderNumber: string;
  kotNumber?: string;
  date: string;
  tableNumber?: string;
  waiterName?: string;
  items: PrintKOTItem[];
  specialNotes?: string;
}

function buildKOTHtml(data: PrintKOTData, autoPrint: boolean) {
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

  return `<!DOCTYPE html>
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
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      ${data.kotNumber ? `<div class="info">KOT No: <span>${data.kotNumber}</span></div>` : ''}
      <div class="info">Order: <span>${data.orderNumber}</span></div>
      ${data.waiterName ? `<div class="info">Waiter: <span>${data.waiterName}</span></div>` : ''}
    </div>
    <div style="text-align:right;font-size:11px;color:#666">
      <div>${data.date}</div>
      ${data.tableNumber ? `<div>Table: <span style="font-weight:600">${data.tableNumber}</span></div>` : ''}
    </div>
  </div>
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
  ${autoPrint ? '<script>window.onload = function() { window.print(); }</script>' : ''}
</body>
</html>`;
}

function doPrint(data: PrintKOTData) {
  const html = buildKOTHtml(data, true);
  const win = window.open('', '_blank', 'width=360,height=500');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export function KOTPreviewDialog({
  data,
  open,
  onOpenChange,
}: {
  data: PrintKOTData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>KOT Preview</DialogTitle>
        </DialogHeader>

        <div className="font-mono text-sm space-y-3 border border-dashed border-border rounded-lg p-4 bg-white dark:bg-zinc-950">
          <div className="text-center">
            <h3 className="text-lg font-bold tracking-widest">KOT</h3>
            <p className="text-xs text-muted-foreground">Kitchen Order Ticket</p>
          </div>

          <div className="border-t-2 border-dashed border-black dark:border-white" />

          <div className="flex justify-between items-start text-xs">
            <div className="space-y-0.5">
              {data.kotNumber && <p>KOT No: <span className="font-bold">{data.kotNumber}</span></p>}
              <p>Order: <span className="font-bold">{data.orderNumber}</span></p>
              {data.waiterName && <p>Waiter: <span className="font-bold">{data.waiterName}</span></p>}
            </div>
            <div className="space-y-0.5 text-right text-[11px] text-muted-foreground">
              <p>{data.date}</p>
              {data.tableNumber && <p>Table: <span className="font-semibold">{data.tableNumber}</span></p>}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-black dark:border-white" />

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black dark:border-white">
                <th className="text-left py-1 px-1">#</th>
                <th className="text-left py-1 px-1">Item</th>
                <th className="text-center py-1 px-1">Qty</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-dashed border-gray-400">
                  <td className="py-1 px-1">{i + 1}</td>
                  <td className="py-1 px-1">{item.name}</td>
                  <td className="py-1 px-1 text-center font-bold text-base">{item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-dashed border-black dark:border-white" />

          {data.specialNotes && (
            <div className="text-xs border border-dashed border-gray-400 rounded p-2">
              <p className="font-bold mb-1">Notes:</p>
              <p>{data.specialNotes}</p>
            </div>
          )}
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
export function printKOT(data: PrintKOTData) {
  doPrint(data);
}

/* ── KOT Tiles Dialog — shows multiple real KOTs as cards ── */

const kotStatusColors: Record<string, string> = {
  sent: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  acknowledged: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'not-sent': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const kotStatusLabels: Record<string, string> = {
  'not-sent': 'Not Sent',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  preparing: 'Preparing',
  ready: 'Ready',
};

const kotBorderColors: Record<string, string> = {
  sent: 'border-amber-400',
  acknowledged: 'border-amber-400',
  preparing: 'border-blue-400',
  ready: 'border-green-400',
  'not-sent': 'border-gray-300',
};

function printKOTTicket(kot: KitchenOrderTicket) {
  const itemsHtml = kot.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:2px 0;font-size:13px">${item.quantity}x ${item.menuItemName}${item.isVeg ? ' (V)' : ''}${item.notes ? `<br><i style="font-size:11px;color:#666">  ${item.notes}</i>` : ''}</td>
        </tr>`
    )
    .join('');

  const win = window.open('', '_blank', 'width=300,height=500');
  if (!win) return;

  win.document.write(`<!DOCTYPE html><html><head><title>KOT</title>
    <style>
      body{font-family:monospace;margin:0;padding:8px;width:270px}
      h2,h3,p{margin:4px 0}
      table{width:100%;border-collapse:collapse}
      hr{border:none;border-top:1px dashed #000;margin:6px 0}
      @media print{body{width:100%}}
    </style></head><body>
    <h2 style="text-align:center;font-size:16px">KOT #${kot.kotNumber}</h2>
    <p style="text-align:center;font-size:12px">${kot.tableNumber ? `Table ${kot.tableNumber}` : 'Takeaway'} | Order #${kot.orderNumber}</p>
    <p style="text-align:center;font-size:11px;color:#666">${new Date(kot.sentAt).toLocaleString()}</p>
    <hr/>
    <table>${itemsHtml}</table>
    <hr/>
    <p style="text-align:center;font-size:11px">${kot.items.length} item(s)</p>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

export function KOTTilesDialog({
  kots,
  open,
  onOpenChange,
  onPrinted,
}: {
  kots: KitchenOrderTicket[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrinted?: (kotId: string) => void;
}) {
  if (kots.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>KOT Preview — {kots.length} KOT{kots.length > 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {kots.map((kot) => (
            <div
              key={kot.id}
              className={`rounded-lg border-2 ${kotBorderColors[kot.status] ?? 'border-gray-300'} bg-card p-4 space-y-3`}
            >
              {/* KOT Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold">{kot.kotNumber}</p>
                  <p className="text-xs text-muted-foreground">Order #{kot.orderNumber}</p>
                  {kot.tableNumber && (
                    <p className="text-xs text-muted-foreground">Table {kot.tableNumber}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={`text-[10px] px-1.5 py-0 ${kotStatusColors[kot.status] ?? ''}`}>
                    {kotStatusLabels[kot.status] ?? kot.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(kot.sentAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {kot.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-1.5 rounded bg-muted/50 px-2 py-1.5 text-sm"
                  >
                    <span className="shrink-0 font-bold text-primary">{item.quantity}x</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">{item.menuItemName}</p>
                      {item.notes && (
                        <p className="text-[11px] italic text-muted-foreground truncate">{item.notes}</p>
                      )}
                    </div>
                    {item.isVeg !== undefined && (
                      <span className={`shrink-0 text-[10px] font-bold ${item.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                        {item.isVeg ? 'V' : 'NV'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Print single KOT */}
              <div className="flex justify-end border-t border-border pt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { printKOTTicket(kot); onPrinted?.(kot.id); }}>
                  <Printer className="mr-1 h-3 w-3" /> Print
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => { kots.forEach((k) => { printKOTTicket(k); onPrinted?.(k.id); }); onOpenChange(false); }}>
            <Printer className="mr-2 h-4 w-4" /> Print All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
