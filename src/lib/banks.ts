export type Bank = {
  slug: string;
  name: string;
  country: "US" | "EU" | "UK" | "AU" | "CA";
  flag: string;
  csvColumns: string;
  steps: string[];
  tips: string;
  exportLocation: string;
  dateRange: string;
};

export const banks: Bank[] = [
  // ── United States ──────────────────────────────────────────
  {
    slug: "chase",
    name: "Chase",
    country: "US",
    flag: "🇺🇸",
    csvColumns: "Transaction Date, Post Date, Description, Category, Type, Amount, Memo",
    exportLocation: "Account page → Download account activity",
    dateRange: "Up to 7 years",
    steps: [
      "Log in to chase.com or open the Chase mobile app",
      "Select the checking or credit card account you want to export",
      "Click the download icon (arrow pointing down) near the transaction list",
      "In the 'Download Account Activity' dialog, choose a custom date range",
      "Select 'CSV' as the file type (not Quicken or QuickBooks)",
      "Click 'Download' — the file saves as your account ending in .CSV",
      "Upload the downloaded CSV to ExpenseAI",
    ],
    tips:
      "Chase's CSV includes its own Category column, but ExpenseAI's AI categorization is more accurate and consistent across merchants. You can safely ignore Chase's built-in categories — ExpenseAI will override them.",
  },
  {
    slug: "bank-of-america",
    name: "Bank of America",
    country: "US",
    flag: "🇺🇸",
    csvColumns: "Date, Description, Amount, Running Bal.",
    exportLocation: "Accounts → Transaction History → Download",
    dateRange: "Up to 18 months",
    steps: [
      "Sign in to bankofamerica.com or the BofA mobile app",
      "From the Accounts overview, click on the account you want to export",
      "Click 'Download' in the top right of the transaction list",
      "Select the date range — you can choose up to 18 months",
      "Under 'File type', choose 'CSV format'",
      "Click 'Download Transactions'",
      "Upload the downloaded file to ExpenseAI",
    ],
    tips:
      "Bank of America's CSV uses a simple four-column format. Negative amounts are expenses, positive are credits. ExpenseAI handles this automatically.",
  },
  {
    slug: "wells-fargo",
    name: "Wells Fargo",
    country: "US",
    flag: "🇺🇸",
    csvColumns: "Date, Amount, *, *, Description",
    exportLocation: "Account Activity → Download Account Activity",
    dateRange: "Up to 2 years",
    steps: [
      "Sign in to wellsfargo.com",
      "Click on the account you want to export from the Account Summary",
      "On the Account Activity page, click 'Download Account Activity' (top right)",
      "Select the date range for your export",
      "Choose 'Comma Separated Values (CSV)' as the file format",
      "Click 'Download'",
      "Upload the file to ExpenseAI",
    ],
    tips:
      "Wells Fargo CSV has some blank columns — ExpenseAI ignores those automatically and reads the Date, Amount, and Description columns correctly.",
  },
  {
    slug: "citi",
    name: "Citi",
    country: "US",
    flag: "🇺🇸",
    csvColumns: "Status, Date, Description, Debit, Credit",
    exportLocation: "Transactions → Download",
    dateRange: "Up to 2 years",
    steps: [
      "Log in to citibank.com",
      "Navigate to the account you want to export",
      "Click on 'Account Details' and then the 'Transactions' tab",
      "Click 'Download' on the right side of the transaction list",
      "Select your date range",
      "Choose 'CSV' as the format",
      "Click 'Download' and save the file",
      "Upload to ExpenseAI",
    ],
    tips:
      "Citi separates debits and credits into two columns instead of one. ExpenseAI handles this split automatically and combines them into a single amount field.",
  },
  {
    slug: "capital-one",
    name: "Capital One",
    country: "US",
    flag: "🇺🇸",
    csvColumns: "Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit",
    exportLocation: "Account Activity → Download Transactions",
    dateRange: "Up to 2 years",
    steps: [
      "Sign in to capitalone.com",
      "Select the account or credit card to export",
      "Click 'Download Transactions' from the account activity view",
      "Choose 'CSV' as the file format",
      "Select your desired date range",
      "Click 'Download'",
      "Upload the CSV to ExpenseAI",
    ],
    tips:
      "Capital One includes a Category column from their own system. ExpenseAI will re-categorize using AI for higher accuracy — especially useful for travel rewards cards with complex merchant names.",
  },
  {
    slug: "american-express",
    name: "American Express",
    country: "US",
    flag: "🇺🇸",
    csvColumns: "Date, Description, Amount, Extended Details, Category, Address, City/State, Zip, Country, Reference",
    exportLocation: "Statements & Activity → Download",
    dateRange: "Up to 7 years",
    steps: [
      "Log in to americanexpress.com",
      "Click 'Statements & Activity' in the top navigation",
      "Select the card you want to export if you have multiple",
      "Click 'Download' (arrow icon near the top of the transaction list)",
      "Choose 'CSV' under the format options",
      "Select your date range",
      "Click 'Download' to save the file",
      "Upload to ExpenseAI",
    ],
    tips:
      "Amex CSV contains very detailed merchant data including address and category. ExpenseAI uses this extra information to improve categorization accuracy for international transactions.",
  },

  // ── Europe ─────────────────────────────────────────────────
  {
    slug: "revolut",
    name: "Revolut",
    country: "EU",
    flag: "🇪🇺",
    csvColumns: "Type, Product, Started Date, Completed Date, Description, Amount, Fee, Currency, State, Balance",
    exportLocation: "App → Profile → Documents → Statement",
    dateRange: "Custom date range",
    steps: [
      "Open the Revolut app on your phone",
      "Tap your profile icon in the top-left corner",
      "Scroll down and tap 'Documents'",
      "Tap 'Statement'",
      "Select the account (e.g. Main, Savings, Crypto) and currency",
      "Choose a custom date range",
      "Select 'Excel' or 'CSV' format",
      "Tap 'Generate Statement' — Revolut emails it to you within minutes",
      "Download from your email and upload to ExpenseAI",
    ],
    tips:
      "Revolut sends statements via email. If you have multiple currency pockets, export each separately. ExpenseAI will normalize all currencies to your chosen base currency during import.",
  },
  {
    slug: "wise",
    name: "Wise",
    country: "EU",
    flag: "🇪🇺",
    csvColumns: "TransferWise ID, Date, Amount, Currency, Description, Payment Reference, Running Balance, Exchange Rate, Payee Name",
    exportLocation: "Account → Statement → Download CSV",
    dateRange: "Custom date range",
    steps: [
      "Log in to wise.com (desktop recommended)",
      "Select the currency account you want to export (e.g. USD, EUR, GBP)",
      "Click 'Statement' in the left sidebar",
      "Choose your date range",
      "Click 'Download' and select 'CSV'",
      "Repeat for each currency balance if needed",
      "Upload the CSV file(s) to ExpenseAI",
    ],
    tips:
      "Wise generates a separate CSV per currency account. If you actively use multiple currencies, export each one separately. ExpenseAI handles multi-currency statements and will flag exchange transactions.",
  },
  {
    slug: "n26",
    name: "N26",
    country: "EU",
    flag: "🇪🇺",
    csvColumns: "Date, Payee, Account number, Transaction type, Payment reference, Amount (EUR), Amount (Foreign Currency), Exchange Rate",
    exportLocation: "Web app → Account → Statements",
    dateRange: "Up to 2 years",
    steps: [
      "Log in to the N26 web app at app.n26.com (mobile app doesn't support CSV export)",
      "Click on your main account",
      "Go to 'Statements' in the left sidebar",
      "Select the month or custom date range",
      "Click the download icon next to the period",
      "Choose 'CSV' format",
      "Save the file and upload it to ExpenseAI",
    ],
    tips:
      "N26 CSV export is only available via the web app — the mobile app shows PDF only. For best results, use the N26 web app on desktop.",
  },
  {
    slug: "monzo",
    name: "Monzo",
    country: "UK",
    flag: "🇬🇧",
    csvColumns: "Transaction ID, Date, Time, Type, Name, Category, Amount, Currency, Notes, Description",
    exportLocation: "App → Help → Export Transactions",
    dateRange: "Custom date range",
    steps: [
      "Open the Monzo app on your phone",
      "Tap the Profile tab (person icon) in the bottom right",
      "Scroll down and tap 'Help'",
      "Search for 'Export transactions' in the help search bar",
      "Tap the 'Export transactions' article and follow the 'export' link",
      "Choose your date range and tap 'Export to CSV'",
      "Monzo emails you the CSV — download from your email",
      "Upload to ExpenseAI",
    ],
    tips:
      "Monzo's CSV includes merchant names, notes, and hashtag categories you've set. ExpenseAI combines this data with AI categorization for excellent results — especially useful for Monzo Pots spending.",
  },

  // ── Global / UK ────────────────────────────────────────────
  {
    slug: "hsbc",
    name: "HSBC",
    country: "UK",
    flag: "🇬🇧",
    csvColumns: "Transaction Date, Description, Debit, Credit, Balance",
    exportLocation: "Accounts → View Transactions → Export",
    dateRange: "Up to 7 years",
    steps: [
      "Log in to hsbc.com or your regional HSBC online banking portal",
      "Select the account you want to export from 'My Accounts'",
      "Click 'View Transactions'",
      "Set the date range using the filter options",
      "Click 'Export' or 'Download' (the label varies by region)",
      "Select 'CSV' or 'Comma Separated Values' as the format",
      "Save the file and upload it to ExpenseAI",
    ],
    tips:
      "HSBC's interface varies by country (UK, US, Hong Kong, etc). The export option is typically under the transaction list. If you see 'Export to spreadsheet', that's the right option — it downloads as CSV.",
  },
  {
    slug: "barclays",
    name: "Barclays",
    country: "UK",
    flag: "🇬🇧",
    csvColumns: "Date, Merchant/Description, Category, Value",
    exportLocation: "Accounts → Statement → Export",
    dateRange: "Up to 7 years",
    steps: [
      "Log in to barclays.co.uk via the desktop browser",
      "Select the account you want to export from 'My accounts'",
      "Click 'Statements and older transactions'",
      "Choose the statement period or enter a custom date range",
      "Click 'Export transactions' (bottom of the page)",
      "Select 'CSV' format",
      "Click 'Export' to download",
      "Upload the file to ExpenseAI",
    ],
    tips:
      "Barclays sometimes exports dates in DD/MM/YYYY format. ExpenseAI automatically detects and converts UK date formats, so no manual editing is needed.",
  },

  // ── Australia ───────────────────────────────────────────────
  {
    slug: "commonwealth-bank",
    name: "Commonwealth Bank",
    country: "AU",
    flag: "🇦🇺",
    csvColumns: "Date, Amount, Description, Balance",
    exportLocation: "NetBank → Export Transactions",
    dateRange: "Up to 7 years",
    steps: [
      "Log in to NetBank at netbank.commbank.com.au",
      "Select the account from 'My accounts'",
      "Go to the 'Transactions' tab",
      "Use the date filter to select the period you need",
      "Click 'Export' (top right of transaction list)",
      "Choose 'CSV' from the format dropdown",
      "Click 'Export' to download",
      "Upload to ExpenseAI",
    ],
    tips:
      "CommBank CSV uses a clean four-column format. The Description field often includes BSB/account references for transfers — ExpenseAI filters these to identify true expense categories.",
  },

  // ── Canada ──────────────────────────────────────────────────
  {
    slug: "td-bank",
    name: "TD Bank",
    country: "CA",
    flag: "🇨🇦",
    csvColumns: "Account Type, Account Number, Transaction Date, Cheque Number, Description 1, Description 2, CAD$, USD$",
    exportLocation: "My Accounts → Download Activity",
    dateRange: "Up to 7 years",
    steps: [
      "Log in to EasyWeb at easywebv2.td.com or tdcanadatrust.com",
      "Select the account from 'My Accounts'",
      "Click 'Download Activity' from the account actions",
      "Select the date range",
      "Choose 'CSV (Comma-separated values)' as the format",
      "Click 'Download'",
      "Upload the CSV to ExpenseAI",
    ],
    tips:
      "TD Bank splits descriptions into two columns (Description 1 and Description 2). ExpenseAI combines them automatically for the best merchant name detection.",
  },
  {
    slug: "scotiabank",
    name: "Scotiabank",
    country: "CA",
    flag: "🇨🇦",
    csvColumns: "Date, Description, Withdrawals, Deposits, Balance",
    exportLocation: "Accounts → Transaction History → Export",
    dateRange: "Up to 7 years",
    steps: [
      "Log in to scotiabank.com via the desktop browser",
      "Select your account from the 'Accounts' menu",
      "Click on 'Transaction History'",
      "Set the date range using the filter",
      "Click 'Export' or 'Download Transactions'",
      "Select 'CSV' as the format",
      "Click 'Export' and save the file",
      "Upload to ExpenseAI",
    ],
    tips:
      "Scotiabank uses separate Withdrawals and Deposits columns. ExpenseAI combines these into a single signed amount automatically during import.",
  },
];

export function getBankBySlug(slug: string): Bank | undefined {
  return banks.find((b) => b.slug === slug);
}

export const banksByRegion: Record<string, Bank[]> = {
  "United States": banks.filter((b) => b.country === "US"),
  "Europe": banks.filter((b) => b.country === "EU"),
  "United Kingdom": banks.filter((b) => b.country === "UK"),
  "Australia": banks.filter((b) => b.country === "AU"),
  "Canada": banks.filter((b) => b.country === "CA"),
};
