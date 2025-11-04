# 🧾 Swipe AI Invoice Manager

> **AI-powered invoice management system** that extracts structured data from PDFs, images, and Excel/CSV files using **Google Gemini 2.5 Flash** — with real-time Redux synchronization and smart data management.

---

## 🌟 Features

* 🤖 **AI Data Extraction** — Upload PDFs, images, Excel/CSV files for automatic data extraction via Google Gemini API
* 🧩 **Three-Tab Interface** — Manage **Invoices**, **Products**, and **Customers** with real-time Redux synchronization
* 🧮 **Smart Tax & Discount Calculation** — Automatically calculates totals, taxes, and discounts
* ✏️ **Inline Editing** — Edit any field directly with validation and visual indicators for missing data
* 📦 **Export Functionality** — Download all tables as Excel or CSV files
* 🧠 **Error Handling** — Intelligent detection for unsupported formats and missing data
* ⚡ **Performance Optimized** — Built with Next.js 15 (Turbopack) and React 19

---

## 🧰 Tech Stack

| Layer                   | Technology                               |
| ----------------------- | ---------------------------------------- |
| **Framework**           | Next.js 15.3 (App Router with Turbopack) |
| **Frontend**            | React 19 + TypeScript 5                  |
| **State Management**    | Redux Toolkit 2.9                        |
| **Styling**             | Tailwind CSS 4.0 + Shadcn/UI             |
| **AI Integration**      | Google Gemini 2.5 Flash                  |
| **Spreadsheet Parsing** | XLSX 0.18.5                              |
| **Animations**          | Framer Motion 12                         |
| **Icons**               | Lucide React 0.552                       |

---

## 🚀 Quick Start

### Prerequisites

* Node.js 20+
* Google Gemini API Key ([Get it here](https://aistudio.google.com/app/apikey))

### Installation

```bash
git clone <repository-url>
cd swipe-assessment
npm install

# Copy environment file
cp .env.example .env.local
# Add your Gemini API key
# NEXT_PUBLIC_GEMINI_API_KEY=your_key_here

npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🧠 How It Works

```
File Upload → Type Detection → Gemini AI Extraction → Data Parsing → Redux Store → Real-time UI Sync
```

### Process Flow

1. **Upload Files** — Supports PDF, PNG, JPG, WebP, XLSX, XLS, CSV
2. **AI Processing** — Google Gemini extracts structured data (invoice, products, customers)
3. **Data Validation** — Missing or unclear fields flagged automatically
4. **Redux Sync** — Data stored centrally and synced across tabs
5. **Editing & Export** — Users can manually edit and export data

---

## 📂 Project Structure

```
swipe-assessment/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (Redux provider)
│   ├── page.tsx            # Main dashboard page
│   ├── globals.css         # Global styles
│   └── global-error.tsx    # Error boundaries
├── components/             # Reusable React components
│   ├── FileUpload.tsx
│   ├── InvoicesTab.tsx
│   ├── ProductsTab.tsx
│   ├── CustomersTab.tsx
│   └── ui/ (Shadcn UI components)
├── store/                  # Redux setup
│   ├── store.ts
│   ├── hooks.ts
│   └── slices/
│       ├── invoicesSlice.ts
│       ├── productsSlice.ts
│       └── customersSlice.ts
├── lib/                    # Utility libraries
│   ├── gemini.ts           # Gemini AI service
│   ├── excelParser.ts      # Excel & CSV parser
│   └── utils.ts
├── .env.local              # Environment variables (ignored)
└── README.md
```

---

## 🧩 Redux Synchronization Logic

When a product or customer name changes:

1. Update dispatch triggers product/customer slice
2. Related invoices automatically update via Redux selectors
3. UI instantly reflects all synced updates across tabs

---

## 🧪 Test Case Coverage

| Test Case | Description                       | Result |
| --------- | --------------------------------- | ------ |
| ✅ Case 1  | PDF Invoice Extraction            | Passed |
| ✅ Case 2  | Image + PDF Combo                 | Passed |
| ✅ Case 3  | Excel File Parsing                | Passed |
| ✅ Case 4  | Multiple Excel Files              | Passed |
| ✅ Case 5  | Mixed Uploads (PDF + Image + CSV) | Passed |

---

## 💡 Troubleshooting

### API Key Error

> **Message:** `Gemini API not initialized`

* Ensure `.env.local` exists
* Verify: `NEXT_PUBLIC_GEMINI_API_KEY=your_actual_key`
* Restart development server

### Extraction Failed

> Check: File format supported, not password-protected, and legible

### Missing Data

> Red borders (⚠️) indicate missing info. Click **Edit** to fill manually.

### Large Files

> Split big PDFs or compress images for faster processing.

---

## 🛠️ Scripts

```bash
npm run dev      # Start development
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Code quality check
```

---

## 🔒 Security & Privacy

* API key secured via `.env.local` (never committed)
* All processing happens **client-side** before upload
* No persistent storage or tracking
* HTTPS required for deployment

---

## ☁️ Deployment

### 🚀 Deploy on Vercel (Recommended)

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variable: `NEXT_PUBLIC_GEMINI_API_KEY`
4. Deploy — Next.js 15 auto-configured

### Other Supported Platforms

* Netlify
* Railway
* Render
* AWS Amplify
* Azure Static Web Apps

---

## 🎨 UI/UX Highlights

* Real-time **inline editing** with validation
* Visual indicators for **missing or invalid data**
* Responsive and mobile-friendly tables
* **Search & sort** functionality across all tabs
* Smooth animations via **Framer Motion**

---

## 🧑‍💻 Code Quality & Best Practices

* ✅ TypeScript fully enforced
* ✅ Modular, DRY component structure
* ✅ Redux hooks (`useAppDispatch`, `useAppSelector`)
* ✅ Error boundaries and validation states
* ✅ Path aliases (`@/components`, `@/lib`)

---

