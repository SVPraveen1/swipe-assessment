'use client';

import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateInvoice, deleteInvoice } from '@/store/slices/invoicesSlice';
import { updateCustomer } from '@/store/slices/customersSlice';
import { Invoice } from '@/store/slices/invoicesSlice';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, Trash2, Download, AlertCircle } from 'lucide-react';
import { exportToExcel, exportToCSV } from '@/lib/excelParser';
import { Checkbox } from '@/components/ui/checkbox';

interface GroupedInvoice {
  id: string; // First invoice ID in group
  serialNumber: string;
  customerName: string;
  productNames: string[]; // Array of product names
  invoiceIds: string[]; // All invoice IDs in this group
  quantity: number; // Total quantity
  tax: number; // Total tax
  totalAmount: number; // Total amount
  date: string;
  missingFields?: string[];
}

export default function InvoicesTab() {
  const invoices = useAppSelector((state) => state.invoices.invoices);
  const customers = useAppSelector((state) => state.customers.customers);
  const dispatch = useAppDispatch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof GroupedInvoice>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<GroupedInvoice>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Group invoices by serial number
  const groupedInvoices = useMemo(() => {
    const groups = new Map<string, GroupedInvoice>();
    
    invoices.forEach(invoice => {
      const existing = groups.get(invoice.serialNumber);
      
      if (existing) {
        // Add to existing group
        existing.productNames.push(invoice.productName);
        existing.invoiceIds.push(invoice.id);
        existing.quantity += invoice.quantity || 0;
        existing.tax += invoice.tax || 0;
        existing.totalAmount += invoice.totalAmount || 0;
        
        // Combine missing fields
        if (invoice.missingFields) {
          const combined = new Set([...(existing.missingFields || []), ...invoice.missingFields]);
          existing.missingFields = Array.from(combined);
        }
      } else {
        // Create new group
        groups.set(invoice.serialNumber, {
          id: invoice.id,
          serialNumber: invoice.serialNumber,
          customerName: invoice.customerName,
          productNames: [invoice.productName],
          invoiceIds: [invoice.id],
          quantity: invoice.quantity || 0,
          tax: invoice.tax || 0,
          totalAmount: invoice.totalAmount || 0,
          date: invoice.date,
          missingFields: invoice.missingFields,
        });
      }
    });
    
    return Array.from(groups.values());
  }, [invoices]);

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = groupedInvoices.filter((invoice) =>
      Object.values(invoice).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [groupedInvoices, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof GroupedInvoice) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (invoice: GroupedInvoice) => {
    setEditingId(invoice.id);
    setEditValues(invoice);
  };

  const handleSave = () => {
    if (editingId && editValues) {
      const groupedInvoice = groupedInvoices.find(inv => inv.id === editingId);
      if (!groupedInvoice) return;

      // Update all invoices in this group
      groupedInvoice.invoiceIds.forEach((invoiceId, index) => {
        const oldInvoice = invoices.find(inv => inv.id === invoiceId);
        if (!oldInvoice) return;

        const updatedInvoice = {
          ...oldInvoice,
          serialNumber: editValues.serialNumber || oldInvoice.serialNumber,
          customerName: editValues.customerName || oldInvoice.customerName,
          date: editValues.date || oldInvoice.date,
        } as Invoice;

        // Update product name if editing (only for single product groups)
        if (groupedInvoice.productNames.length === 1 && editValues.productNames?.[0]) {
          updatedInvoice.productName = editValues.productNames[0];
        }

        const missingFields: string[] = [];
        if (!updatedInvoice.serialNumber) missingFields.push('serialNumber');
        if (!updatedInvoice.customerName) missingFields.push('customerName');
        if (!updatedInvoice.productName) missingFields.push('productName');
        if (!updatedInvoice.quantity) missingFields.push('quantity');
        if (updatedInvoice.tax === undefined || updatedInvoice.tax === null) missingFields.push('tax');
        if (updatedInvoice.totalAmount === undefined || updatedInvoice.totalAmount === null) missingFields.push('totalAmount');
        if (!updatedInvoice.date) missingFields.push('date');
        
        updatedInvoice.missingFields = missingFields.length > 0 ? missingFields : undefined;
        
        dispatch(updateInvoice(updatedInvoice));

        // Sync customer name changes
        if (oldInvoice.customerName !== updatedInvoice.customerName) {
          const customer = customers.find(c => c.name === oldInvoice.customerName);
          if (customer) {
            const updatedCustomerInvoices = invoices.filter(inv => 
              inv.customerName === oldInvoice.customerName
            ).map(inv => 
              groupedInvoice.invoiceIds.includes(inv.id)
                ? { ...inv, customerName: updatedInvoice.customerName }
                : inv
            );
            
            const newTotal = updatedCustomerInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
            
            dispatch(updateCustomer({
              ...customer,
              name: updatedInvoice.customerName,
              totalPurchaseAmount: newTotal,
              missingFields: !updatedInvoice.customerName ? ['name'] : undefined
            }));
            
            // Update all other invoices with the old customer name
            invoices
              .filter(inv => inv.customerName === oldInvoice.customerName && !groupedInvoice.invoiceIds.includes(inv.id))
              .forEach(inv => {
                dispatch(updateInvoice({
                  ...inv,
                  customerName: updatedInvoice.customerName,
                }));
              });
          }
        }
      });

      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = (groupedInvoice: GroupedInvoice) => {
    // Delete all invoices in this group
    groupedInvoice.invoiceIds.forEach(id => {
      dispatch(deleteInvoice(id));
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedInvoices.map(inv => inv.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = (format: 'excel' | 'csv') => {
    // Export individual invoices, not grouped
    const dataToExport = selectedIds.length > 0
      ? invoices.filter(inv => {
          const group = groupedInvoices.find(g => g.invoiceIds.includes(inv.id));
          return group && selectedIds.includes(group.id);
        })
      : invoices;
    
    const exportData = dataToExport.map(({ id, missingFields, customerId, productId, ...rest }) => rest);
    if (format === 'excel') {
      exportToExcel(exportData, 'invoices');
    } else {
      exportToCSV(exportData, 'invoices');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => handleExport('excel')}>
          <Download className="h-4 w-4 mr-2" />
          Excel {selectedIds.length > 0 && `(${selectedIds.length})`}
        </Button>
        <Button variant="outline" onClick={() => handleExport('csv')}>
          <Download className="h-4 w-4 mr-2" />
          CSV {selectedIds.length > 0 && `(${selectedIds.length})`}
        </Button>
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === filteredAndSortedInvoices.length && filteredAndSortedInvoices.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead onClick={() => handleSort('serialNumber')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Serial Number
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('customerName')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Customer Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                Product Names
              </TableHead>
              <TableHead onClick={() => handleSort('quantity')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Quantity
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('tax')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Tax
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('totalAmount')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Total Amount
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('date')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No invoices found. Upload files to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(invoice.id)}
                      onCheckedChange={() => toggleSelect(invoice.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === invoice.id ? (
                      <Input
                        value={editValues.serialNumber || ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, serialNumber: e.target.value })
                        }
                        className={
                          invoice.missingFields?.includes('serialNumber')
                            ? 'border-destructive'
                            : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {invoice.serialNumber || '-'}
                        {invoice.missingFields?.includes('serialNumber') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === invoice.id ? (
                      <Input
                        value={editValues.customerName || ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, customerName: e.target.value })
                        }
                        className={
                          invoice.missingFields?.includes('customerName')
                            ? 'border-destructive'
                            : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {invoice.customerName || '-'}
                        {invoice.missingFields?.includes('customerName') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === invoice.id ? (
                      <Input
                        value={editValues.productNames?.join(', ') || ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, productNames: e.target.value.split(',').map(s => s.trim()) })
                        }
                        className={
                          invoice.missingFields?.includes('productName') ? 'border-destructive' : ''
                        }
                        disabled={invoice.productNames.length > 1}
                        placeholder={invoice.productNames.length > 1 ? 'Edit individual products in Products tab' : ''}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {invoice.productNames.length === 1
                            ? invoice.productNames[0]
                            : 'Multiple Products'
                          }
                        </span>
                        {invoice.missingFields?.includes('productName') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {invoice.quantity || 0}
                      {invoice.missingFields?.includes('quantity') && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      ₹{invoice.tax?.toFixed(2) || '0.00'}
                      {invoice.missingFields?.includes('tax') && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      ₹{invoice.totalAmount?.toFixed(2) || '0.00'}
                      {invoice.missingFields?.includes('totalAmount') && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingId === invoice.id ? (
                      <Input
                        type="date"
                        value={editValues.date || ''}
                        onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                        className={
                          invoice.missingFields?.includes('date') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {invoice.date || '-'}
                        {invoice.missingFields?.includes('date') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === invoice.id ? (
                        <>
                          <Button size="sm" onClick={handleSave}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(invoice)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(invoice)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedInvoices.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedInvoices.length} of {groupedInvoices.length} invoices
          {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
        </div>
      )}
    </div>
  );
}