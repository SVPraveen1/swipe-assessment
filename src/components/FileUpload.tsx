'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, Table, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { geminiService } from '@/lib/gemini';
import { parseExcelFile } from '@/lib/excelParser';
import { useAppDispatch } from '@/store/hooks';
import { addInvoices } from '@/store/slices/invoicesSlice';
import { addProducts } from '@/store/slices/productsSlice';
import { addCustomers } from '@/store/slices/customersSlice';

export default function FileUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      let extractedData;

      if (file.type === 'application/pdf') {
        extractedData = await geminiService.extractFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        extractedData = await geminiService.extractFromImage(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.csv')
      ) {
        const excelText = await parseExcelFile(file);
        extractedData = await geminiService.extractFromText(excelText);
      } else {
        throw new Error('Unsupported file format');
      }

      // Add unique IDs and dispatch to Redux
      const invoicesWithIds = extractedData.invoices.map((inv: any) => ({
        ...inv,
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      const productsWithIds = extractedData.products.map((prod: any) => ({
        ...prod,
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      const customersWithIds = extractedData.customers.map((cust: any) => ({
        ...cust,
        id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      dispatch(addInvoices(invoicesWithIds));
      dispatch(addProducts(productsWithIds));
      dispatch(addCustomers(customersWithIds));

      setError(null);
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      for (const file of acceptedFiles) {
        await processFile(file);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex justify-center mb-4">
          {isProcessing ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          ) : (
            <Upload className="h-12 w-12 text-muted-foreground" />
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2">
          {isProcessing
            ? 'Processing files...'
            : isDragActive
            ? 'Drop files here'
            : 'Upload Invoice Files'}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          Drag & drop files or click to browse
        </p>

        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </div>
          <div className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            <span>Images</span>
          </div>
          <div className="flex items-center gap-1">
            <Table className="h-4 w-4" />
            <span>Excel/CSV</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
