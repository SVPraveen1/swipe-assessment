'use client';

import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateProduct, deleteProduct } from '@/store/slices/productsSlice';
import { updateInvoice } from '@/store/slices/invoicesSlice';
import { Product } from '@/store/slices/productsSlice';
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

export default function ProductsTab() {
  const products = useAppSelector((state) => state.products.products);
  const invoices = useAppSelector((state) => state.invoices.invoices);
  const dispatch = useAppDispatch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) =>
      Object.values(product).some((value) =>
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
  }, [products, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues(product);
  };

  const handleSave = () => {
    if (editingId && editValues) {
      const oldProduct = products.find(p => p.id === editingId);
      const updatedProduct = { ...editValues, id: editingId } as Product;
      
      // Remove missing fields for edited values
      const missingFields: string[] = [];
      if (!updatedProduct.name) missingFields.push('name');
      if (!updatedProduct.quantity && updatedProduct.quantity !== 0) missingFields.push('quantity');
      if (!updatedProduct.unitPrice && updatedProduct.unitPrice !== 0) missingFields.push('unitPrice');
      if (!updatedProduct.tax && updatedProduct.tax !== 0) missingFields.push('tax');
      if (!updatedProduct.priceWithTax && updatedProduct.priceWithTax !== 0) missingFields.push('priceWithTax');
      
      updatedProduct.missingFields = missingFields.length > 0 ? missingFields : undefined;
      
      dispatch(updateProduct(updatedProduct));

      // Sync with invoices - update all invoices with this product
      if (oldProduct && oldProduct.name !== updatedProduct.name) {
        invoices
          .filter(inv => inv.productName === oldProduct.name)
          .forEach(inv => {
            dispatch(updateInvoice({
              ...inv,
              productName: updatedProduct.name,
              missingFields: inv.missingFields?.filter(f => f !== 'productName')
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
    dispatch(deleteProduct(id));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedProducts.map(prod => prod.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = (format: 'excel' | 'csv') => {
    const dataToExport = selectedIds.length > 0
      ? products.filter(prod => selectedIds.includes(prod.id))
      : products;
    
    const exportData = dataToExport.map(({ id, missingFields, ...rest }) => rest);
    if (format === 'excel') {
      exportToExcel(exportData, 'products');
    } else {
      exportToCSV(exportData, 'products');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
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
                  checked={selectedIds.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('quantity')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Quantity
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('unitPrice')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Unit Price
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('tax')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Tax
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('priceWithTax')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Price with Tax
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('discount')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  Discount
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No products found. Upload files to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => toggleSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input
                        value={editValues.name || ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, name: e.target.value })
                        }
                        className={
                          product.missingFields?.includes('name') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {product.name || '-'}
                        {product.missingFields?.includes('name') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input
                        type="number"
                        value={editValues.quantity || 0}
                        onChange={(e) =>
                          setEditValues({ ...editValues, quantity: Number(e.target.value) })
                        }
                        className={
                          product.missingFields?.includes('quantity') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {product.quantity || 0}
                        {product.missingFields?.includes('quantity') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.unitPrice || 0}
                        onChange={(e) =>
                          setEditValues({ ...editValues, unitPrice: Number(e.target.value) })
                        }
                        className={
                          product.missingFields?.includes('unitPrice') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        ₹{product.unitPrice?.toFixed(2) || '0.00'}
                        {product.missingFields?.includes('unitPrice') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.tax || 0}
                        onChange={(e) =>
                          setEditValues({ ...editValues, tax: Number(e.target.value) })
                        }
                        className={
                          product.missingFields?.includes('tax') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        ₹{product.tax?.toFixed(2) || '0.00'}
                        {product.missingFields?.includes('tax') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.priceWithTax || 0}
                        onChange={(e) =>
                          setEditValues({ ...editValues, priceWithTax: Number(e.target.value) })
                        }
                        className={
                          product.missingFields?.includes('priceWithTax') ? 'border-destructive' : ''
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        ₹{product.priceWithTax?.toFixed(2) || '0.00'}
                        {product.missingFields?.includes('priceWithTax') && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.discount || 0}
                        onChange={(e) =>
                          setEditValues({ ...editValues, discount: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {product.discount ? `₹${product.discount.toFixed(2)}` : '-'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === product.id ? (
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
                          <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product.id)}
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

      {filteredAndSortedProducts.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedProducts.length} of {products.length} products
          {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
        </div>
      )}
    </div>
  );
}