'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/FileUpload';
import InvoicesTab from '@/components/InvoicesTab';
import ProductsTab from '@/components/ProductsTab';
import CustomersTab from '@/components/CustomersTab';
import { FileText, Package, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Swipe AI Invoice Manager</h1>
          <p className="text-muted-foreground">
            Automated data extraction and real-time management of invoices, products, and customers
          </p>
        </div>

        <div className="mb-8">
          <FileUpload />
        </div>

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-6">
            <InvoicesTab />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <CustomersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}