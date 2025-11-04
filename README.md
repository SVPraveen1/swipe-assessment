# Swipe AI Invoice Manager

A powerful React web application that automates data extraction and real-time management of invoices, products, and customers using AI-powered processing.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.0-purple)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-orange)

## 🌟 Features

### 1. **AI-Powered Data Extraction**
- **Universal File Support**: Process PDFs, images (PNG, JPG, JPEG, WebP), Excel files (.xlsx, .xls), and CSV files
- **Google Gemini Integration**: Utilizes Gemini 1.5 Flash model for intelligent document understanding
- **Structured Data Parsing**: Automatically extracts and organizes data into Invoices, Products, and Customers
- **Missing Field Detection**: Identifies and highlights incomplete or unclear data with visual indicators

### 2. **Three-Tab Management System**

#### **Invoices Tab**
- Serial Number
- Customer Name
- Product Name
- Quantity
- Tax
- Total Amount
- Date
- Real-time editing capabilities
- Search and sort functionality

#### **Products Tab**
- Name
- Quantity
- Unit Price
- Tax
- Price with Tax
- Discount (optional)
- Inline editing with validation

#### **Customers Tab**
- Customer Name
- Phone Number
- Total Purchase Amount
- Email (optional)
- Address (optional)
- Complete CRUD operations

### 3. **Real-Time Redux Synchronization**
- Centralized state management with Redux Toolkit
- Automatic cross-tab updates when data changes
- When a product name is updated in Products tab, all related invoices are automatically updated
- When a customer name is updated in Customers tab, all related invoices reflect the change instantly

### 4. **Advanced Features**
- **Drag & Drop Upload**: Easy file upload with visual feedback
- **Search & Filter**: Real-time search across all data fields
- **Sortable Columns**: Click column headers to sort data
- **Export Functionality**: Download data as Excel or CSV
- **Validation Indicators**: Red borders and alert icons for missing fields
- **Loading States**: Visual feedback during AI processing
- **Error Handling**: User-friendly error messages for unsupported formats or extraction failures

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd swipe-ai-invoice-manager
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Set up environment variables**
```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your Google Gemini API key
# NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

4. **Run the development server**
```bash
npm run dev
# or
bun dev
```

5. **Open the application**
Navigate to [http://localhost:3000](http://localhost:3000)

### Setting Up API Key

The application automatically reads your Google Gemini API key from the `.env.local` file. 

1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open `.env.local` file in the project root
3. Replace `your_api_key_here` with your actual API key
4. Restart the development server
5. You're ready to upload files!

**Note**: Never commit your `.env.local` file to version control. It's already added to `.gitignore`.

## 🤖 AI Data Extraction Architecture

### How It Works

The application uses a **generic AI-based extraction solution** that handles all file types uniformly:

#### 1. **File Processing Pipeline**

```
File Upload → Type Detection → Content Extraction → AI Processing → Data Parsing → Redux Store
```

#### 2. **Gemini Integration** (`src/lib/gemini.ts`)

The `GeminiService` class provides three main methods:

- **`extractFromImage(file)`**: Processes image files (JPG, PNG, WebP)
- **`extractFromPDF(file)`**: Handles PDF documents
- **`extractFromText(text)`**: Processes Excel/CSV data converted to text

#### 3. **Extraction Prompt**

The AI uses a carefully crafted prompt that:
- Identifies invoice details (serial number, customer, product, amounts, dates)
- Extracts product information (name, quantity, price, tax)
- Captures customer data (name, phone, purchase amounts, contact info)
- Detects and reports missing fields in a `missingFields` array
- Returns structured JSON data

#### 4. **Excel/CSV Processing** (`src/lib/excelParser.ts`)

Excel and CSV files are processed in two steps:
1. XLSX library converts spreadsheet data to JSON format
2. JSON is converted to text and passed to Gemini for intelligent extraction

#### 5. **Data Validation**

After extraction, the system:
- Assigns unique IDs to each record
- Validates required fields
- Highlights missing or incomplete data
- Dispatches to Redux store for state management

## 📊 Test Cases Support

The application successfully handles all test cases from the assignment:

### ✅ Case 1: Invoice PDFs
- Extracts invoice details, line items, customer information
- Handles multi-page invoices
- Identifies tax rates and total amounts

### ✅ Case 2: Invoice PDF + Images
- Processes multiple file types in a single upload
- Combines data from different sources
- Maintains data consistency across formats

### ✅ Case 3: Excel File
- Parses tabular data with headers
- Identifies columns and maps to appropriate fields
- Handles various Excel formats (.xlsx, .xls)

### ✅ Case 4: Multiple Excel Files
- Processes batch uploads
- Aggregates data from multiple sources
- Prevents duplicate entries

### ✅ Case 5: All Types of Files
- Handles mixed file uploads (PDF + Images + Excel)
- Maintains data integrity across file types
- Provides unified extraction experience

### Missing Field Handling

When required information is missing from a file:
- The field is marked in the `missingFields` array
- Visual indicators (red borders, alert icons) appear in the UI
- Users can edit and complete missing information inline
- Data is still imported, allowing manual completion

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **State Management**: Redux Toolkit with React-Redux
- **UI Components**: Shadcn/UI with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **AI Processing**: Google Gemini API
- **File Processing**: xlsx library, react-dropzone
- **Icons**: Lucide React

### Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Redux Provider
│   ├── page.tsx            # Main application page with tabs
│   └── globals.css         # Global styles
├── components/
│   ├── FileUpload.tsx      # Drag & drop file upload component
│   ├── InvoicesTab.tsx     # Invoices management table
│   ├── ProductsTab.tsx     # Products management table
│   ├── CustomersTab.tsx    # Customers management table
│   ├── StoreProvider.tsx   # Redux store provider wrapper
│   └── ui/                 # Shadcn UI components
├── store/
│   ├── store.ts            # Redux store configuration
│   ├── hooks.ts            # Typed Redux hooks
│   └── slices/
│       ├── invoicesSlice.ts   # Invoices state management
│       ├── productsSlice.ts   # Products state management
│       └── customersSlice.ts  # Customers state management
└── lib/
    ├── gemini.ts           # Google Gemini AI service
    ├── excelParser.ts      # Excel/CSV parsing & export
    └── utils.ts            # Utility functions
```

### State Management Flow

```
User Action → Component → Dispatch Action → Redux Slice → State Update → Re-render
                                                ↓
                                        Sync to Related Tabs
```

**Example**: Updating a product name in Products tab:
1. User edits product name and clicks "Save"
2. `updateProduct` action is dispatched
3. Redux updates the product in state
4. Component finds all invoices with old product name
5. Dispatches `updateInvoice` for each related invoice
6. All tabs automatically reflect the change

## 🎨 UI/UX Features

### Visual Indicators
- **Missing Fields**: Red border + alert icon (⚠️)
- **Loading State**: Spinning loader during AI processing
- **Drag Active**: Blue border when dragging files over dropzone
- **Sortable Columns**: Arrow icons indicating sort direction

### Interactive Elements
- **Inline Editing**: Click "Edit" to modify any row
- **Search**: Real-time filtering across all columns
- **Export**: Download tables as Excel or CSV
- **Delete**: Confirmation dialog before deletion

### Responsive Design
- Mobile-friendly layout
- Scrollable tables for large datasets
- Adaptive column widths
- Touch-friendly buttons and inputs

## 📝 Code Quality

### Best Practices Followed

- **Modular Architecture**: Separated concerns (UI, state, services, utilities)
- **TypeScript**: Fully typed for type safety and better DX
- **Custom Hooks**: `useAppDispatch` and `useAppSelector` for type-safe Redux
- **Error Handling**: Try-catch blocks with user-friendly messages
- **Loading States**: Visual feedback for async operations
- **Validation**: Client-side validation with visual indicators
- **Clean Code**: Consistent naming, proper comments, DRY principles

### Performance Optimizations

- **useMemo**: Memoized filtered and sorted data
- **Lazy Loading**: Components loaded on-demand
- **Efficient Re-renders**: Redux selector optimization
- **File Processing**: Async operations with loading feedback

## 🔒 Security Considerations

- API key stored securely in environment variables (not in code)
- `.env.local` file excluded from version control via `.gitignore`
- File processing happens client-side before AI upload
- No sensitive data stored in localStorage
- User data never leaves the browser except for AI processing

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Deploy with default settings
4. Share the deployment URL

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy the `.next` folder
3. Configure as Next.js application
4. Set environment variables if needed

## 📖 Usage Guide

### Step 1: Configure API Key
Ensure your `.env.local` file contains your Google Gemini API key (see Installation steps above)

### Step 2: Upload Files
Drag and drop or click to browse for:
- Invoice PDFs
- Invoice images (scanned or photographed)
- Excel/CSV files with transaction data

### Step 3: Review Extracted Data
- Navigate between Invoices, Products, and Customers tabs
- Review automatically extracted information
- Look for red borders indicating missing fields

### Step 4: Edit and Complete Data
- Click "Edit" on any row
- Fill in missing information
- Click "Save" to confirm changes
- Changes sync automatically across tabs

### Step 5: Export Results
- Click "Excel" or "CSV" button to download
- Data is exported without internal IDs
- Ready for further processing or reporting

## 🐛 Troubleshooting

### API Key Error
**Problem**: "Gemini API not initialized. Please check your API key in the .env.local file."
**Solution**: 
- Ensure `.env.local` file exists in project root
- Verify the API key is correctly set: `NEXT_PUBLIC_GEMINI_API_KEY=your_actual_key`
- Restart the development server after updating the env file

### Extraction Fails
**Problem**: "Failed to parse AI response"
**Solution**: 
- Check file format is supported
- Ensure image quality is clear and readable
- Verify PDF is not corrupted or password-protected

### Missing Data
**Problem**: Some fields show alert icons
**Solution**: This is expected! Click "Edit" and manually fill missing fields

### Large Files
**Problem**: Processing takes too long
**Solution**: 
- Split large PDFs into smaller files
- Compress images before upload
- Process files in batches

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is created for the Swipe assignment and is available for educational purposes.

## 🙏 Acknowledgments

- Google Gemini API for powerful AI processing
- Shadcn/UI for beautiful component library
- Vercel for Next.js framework
- Open source community for excellent tools

## 📞 Support

For questions or issues:
- Create an issue in the repository
- Review the troubleshooting section
- Check Google Gemini API documentation

---

**Built with ❤️ for Swipe** | [Live Demo](#) | [GitHub Repository](#)