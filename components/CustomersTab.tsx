'use client';

import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateCustomer, deleteCustomer } from '@/store/slices/customersSlice';
import { updateInvoice } from '@/store/slices/invoicesSlice';
import { Customer } from '@/store/slices/customersSlice';
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

export default function CustomersTab() {
  const customers = useAppSelector((state) => state.customers.customers);
  const invoices = useAppSelector((state) => state.invoices.invoices);
  const dispatch = useAppDispatch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Customer>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter((customer) =>
      Object.values(customer).some((value) =>
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
  }, [customers, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditValues(customer);
  };

  const handleSave = () => {
    if (editingId && editValues) {
      const oldCustomer = customers.find(c => c.id === editingId);
      const updatedCustomer = { ...editValues, id: editingId } as Customer;
      
      // Remove missing fields for edited values
      const missingFields: string[] = [];
      if (!updatedCustomer.name) missingFields.push('name');
      if (!updatedCustomer.phoneNumber) missingFields.push('phoneNumber');
      if (!updatedCustomer.totalPurchaseAmount && updatedCustomer.totalPurchaseAmount !== 0) missingFields.push('totalPurchaseAmount');
      
      updatedCustomer.missingFields = missingFields.length > 0 ? missingFields : undefined;
      
      dispatch(updateCustomer(updatedCustomer));

      // Sync with invoices - update all invoices with this customer
      if (oldCustomer && oldCustomer.name !== updatedCustomer.name) {
        invoices
          .filter(inv => inv.customerName === oldCustomer.name)
          .forEach(inv => {
            dispatch(updateInvoice({
              ...inv,
              customerName: updatedCustomer.name,
              missingFields: inv.missingFields?.filter(f => f !== 'customerName')
            }));
          });
      }

      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = (id: string) => {
    dispatch(deleteCustomer(id));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedCustomers.map(cust => cust.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = (format: 'excel' | 'csv') => {
    const dataToExport = selectedIds.length > 0
      ? customers.filter(cust => selectedIds.includes(cust.id))
      : customers;
    
    const exportData = dataToExport.map(({ id, missingFields, ...rest }) => rest);
    if (format === 'excel') {
      exportToExcel(exportData, 'customers');
    } else {
      exportToCSV(exportData, 'customers');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
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
                  checked={selectedIds.length === filteredAndSortedCustomers.length && filteredAndSortedCustomers.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Customer Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('phoneNumber')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Phone Number
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('totalPurchaseAmount')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Total Purchase Amount
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('email')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Email
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('address')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Address
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No customers found. Upload files to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(customer.id)}
                      onCheckedChange={() => toggleSelect(customer.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === customer.id ? (
                      <Input
                        value={editValues.name || ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, name: e.target.value })
                        }
                        className={
                          customer.missingFields?.includes('name') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {customer.name || '-'}
                        {customer.missingFields?.includes('name') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === customer.id ? (
                      <Input
                        value={editValues.phoneNumber || ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, phoneNumber: e.target.value })
                        }
                        className={
                          customer.missingFields?.includes('phoneNumber') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {customer.phoneNumber || '-'}
                        {customer.missingFields?.includes('phoneNumber') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === customer.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.totalPurchaseAmount || 0}
                        onChange={(e) =>
                          setEditValues({ ...editValues, totalPurchaseAmount: Number(e.target.value) })
                        }
                        className={
                          customer.missingFields?.includes('totalPurchaseAmount') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        ₹{customer.totalPurchaseAmount?.toFixed(2) || '0.00'}
                        {customer.missingFields?.includes('totalPurchaseAmount') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === customer.id ? (
                      <Input
                        type="email"
                        value={editValues.email || ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, email: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {customer.email || '-'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === customer.id ? (
                      <Input
                        value={editValues.address || ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, address: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {customer.address || '-'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === customer.id ? (
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
                          <Button size="sm" variant="outline" onClick={() => handleEdit(customer)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(customer.id)}
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

      {filteredAndSortedCustomers.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedCustomers.length} of {customers.length} customers
          {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
        </div>
      )}
    </div>
  );
}