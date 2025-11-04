import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedData {
  invoices: any[];
  products: any[];
  customers: any[];
}

const EXTRACTION_PROMPT = `
You are an AI assistant that extracts invoice, product, and customer data from various file formats (PDFs, images, Excel files).

Analyze the provided content and extract the following information in JSON format:

{
  "invoices": [
    {
      "serialNumber": "string (invoice number/ID)",
      "customerName": "string",
      "productName": "string",
      "quantity": number,
      "tax": number (tax amount in INR),
      "totalAmount": number (in INR),
      "date": "string (YYYY-MM-DD format)",
      "missingFields": ["array of field names that are missing or unclear"]
    }
  ],
  "products": [
    {
      "name": "string",
      "quantity": number,
      "unitPrice": number (in INR),
      "tax": number (in INR),
      "priceWithTax": number (in INR),
      "discount": number (optional, in INR),
      "missingFields": ["array of field names that are missing"]
    }
  ],
  "customers": [
    {
      "name": "string",
      "phoneNumber": "string",
      "totalPurchaseAmount": number (in INR),
      "email": "string (optional)",
      "address": "string (optional)",
      "missingFields": ["array of field names that are missing"]
    }
  ]
}

CRITICAL INSTRUCTIONS FOR TAX CALCULATION:
1. If BOTH "original amount" (amount before tax) and "final amount" (amount with tax) are present:
   - Tax = Final Amount - Original Amount
   - Unit Price = Original Amount / Quantity (if discount is applied, adjust accordingly)
   - DO NOT recalculate tax from percentages
   
2. If there's a discount:
   - First apply discount to base price to get discounted price
   - Then calculate tax on the discounted price
   - Example: Base Price 79990, Discount 7% = -5599.3, Discounted Amount = 69183.35
   - If Final Amount with Tax = 79990, then Tax = 79990 - 69183.35 = 10806.65
   - Unit Price = 69183.35 (the discounted amount, NOT the original base price)

3. For products with multiple line items:
   - If one serial number has multiple products listed, create SEPARATE invoice entries for EACH product
   - Each product should have its own row with the same serial number
   - Example: Serial RAY/23-24/286 has iPhone 16, iPhone 16 Cover, Beats PRO X
   - Create 3 separate invoice entries all with serial "RAY/23-24/286"

IMPORTANT INSTRUCTIONS:
1. Extract ALL invoices, products, and customers found in the document
2. If one serial number/invoice has multiple products, create separate invoice entries for each product
3. If a field is missing, include it in the "missingFields" array
4. For tax, use the actual tax amount from the document (price with tax - price without tax)
5. DO NOT use original/base prices if discounts are applied - use the discounted price as unitPrice
6. Aggregate customer purchase amounts if multiple invoices exist
7. Return ONLY valid JSON, no markdown formatting
8. All amounts should be in INR (Indian Rupees)
9. If data is unclear, make best effort extraction and mark fields as missing
`;

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_api_key_here') {
      this.initialize(apiKey);
    }
  }

  initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async extractFromImage(file: File): Promise<ExtractedData> {
    if (!this.model) {
      throw new Error('Gemini API not initialized');
    }

    const base64Data = await this.fileToBase64(file);
    const imagePart = {
      inlineData: {
        data: base64Data.split(',')[1],
        mimeType: file.type,
      },
    };

    const result = await this.model.generateContent([EXTRACTION_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    return this.parseResponse(text);
  }

  async extractFromPDF(file: File): Promise<ExtractedData> {
    if (!this.model) {
      throw new Error('Gemini API not initialized.');
    }

    const base64Data = await this.fileToBase64(file);
    const pdfPart = {
      inlineData: {
        data: base64Data.split(',')[1],
        mimeType: 'application/pdf',
      },
    };

    const result = await this.model.generateContent([EXTRACTION_PROMPT, pdfPart]);
    const response = await result.response;
    const text = response.text();
    
    return this.parseResponse(text);
  }

  async extractFromText(text: string): Promise<ExtractedData> {
    if (!this.model) {
      throw new Error('Gemini API not initialized');
    }

    const result = await this.model.generateContent([
      EXTRACTION_PROMPT,
      `\n\nDocument Content:\n${text}`,
    ]);
    const response = await result.response;
    const responseText = response.text();
    
    return this.parseResponse(responseText);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  private parseResponse(text: string): ExtractedData {
    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    try {
      const parsed = JSON.parse(jsonText);
      return {
        invoices: parsed.invoices || [],
        products: parsed.products || [],
        customers: parsed.customers || [],
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Response text:', jsonText);
      throw new Error('Failed to parse AI response. Please check the file format.');
    }
  }
}

export const geminiService = new GeminiService();