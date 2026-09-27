# Project Constitution: Hisaab Pro V1.0

This document defines the persistent engineering rules, structural guidelines, and compliance standards for the Hisaab Pro application. All agents and developers working on this codebase must adhere strictly to these practices.

---

## 1. UAE Currency & Taxation Compliance

*   **Primary Currency:** All financial modules, calculations, reports, and document line-items must use **AED** (United Arab Emirates Dirham) as the standard currency. Format currency precisely to 2 decimal places with thousands separators (e.g., `AED 1,250.00`).
*   **Standard VAT Rate:** Apply a flat **5% VAT** on all taxable sales documents, invoices, and expense sheets as prescribed by the UAE Federal Tax Authority (FTA).
*   **Calculations Integrity:** Always compute totals using floating-point precision on subtotal levels before rounding to prevent rounding mismatches in tax reports.

---

## 2. Component Architecture & Styling Rules

*   **Styling Methodology:** Use Tailwind CSS utility classes exclusively. Avoid custom external CSS files, styles-in-JS, or inline style blocks unless rendering complex vector graphs.
*   **Responsive Fluidity:** Keep interfaces desktop-first optimized, but fully responsive using Tailwind breakpoints (`sm:`, `md:`, `lg:`). Maintain a maximum width container (`max-w-7xl mx-auto`) for main workspaces.
*   **Component State Modularity:** Keep components clean and modular. State boundaries between dashboards, sales trackers, and settings should stay highly decoupled, communicating updates through standard event callbacks.
*   **Types & Imports:** Place all module imports at the very top of each file. Avoid using `import type` when dealing with TypeScript enum declarations.

---

## 3. PDF & Print Structure Guidelines

*   **Aesthetic Print Forms:** Custom Invoice, Quotation, and Delivery Note templates must present bilingual labels (English/Arabic) for institutional standard compliance in the GCC region.
*   **Utility Layout Bounds:** Wrap interactive floating hubs, filters, search bars, sidebars, and control action buttons in the `.no-print` CSS helper class so they are automatically omitted during native browser printing (`window.print()`).
*   **Page-Break Control:** Apply explicit print layout utilities (e.g., `break-after-page`, page padding, and custom margin wrappers) to prevent truncated paragraphs and split line-items when bulk-printing invoices or tax statements.

---

## 4. Staff Module & Permission Toggle Convention

*   **Role-Based Security:** Ensure role boundaries (e.g., Owner, Admin, Staff) are respected across the interface.
*   **Access-Control Gates:** Conditionally render management controls, revenue panels, company settings, and transaction deletion buttons based on active staff privileges.
*   **Graceful Toggles:** Disable unauthorized buttons with helpful tooltip titles instead of silently removing them to maintain clean UI layout symmetry.

---

## 5. Inventory Management Module & Validation Rules

*   **Default State Constraint:** The "Enable Inventory Management" setting must default to **OFF** for new companies to support faster manual invoicing without onboarding hurdles.
*   **Active Inventory Validation (Toggle ON):** When Inventory Management is enabled, manual item descriptions/SKU entries are strictly barred in Sales Documents. Items must be selected exclusively from the registered catalog, and saving is strictly gated on verifying that the quantity to sell does not exceed current available stock.
*   **Passive Inventory Invoicing (Toggle OFF):** When Inventory Management is disabled, the system displays an "Add Manual Item" button. Users are free to input custom, ad-hoc text item descriptions and SKUs without inventory stock limit validations.

---

## 6. Data Import & Customer Validator Rules

*   **TRN Optionality:** The Tax Registration Number (TRN) column is completely optional to prevent data entry hurdles. If a row does not contain a TRN, the system must trigger a non-blocking warning ("TRN missing - Update for FTA Compliance") but classify the row as valid for import.
*   **TRN Strict Validation:** If a TRN is provided, it must be verified strictly to ensure it is exactly 15 digits long. Any deviations must raise a validation error and block the row's import.
*   **Mandatory Columns:** The `CustomerName*`, `Emirate*`, and `Phone*` columns are strictly mandatory. Missing values in these columns must halt validation for that row.

---

## 7. Accounting Rules & Double-Entry Principles

*   **Double-Entry Match:** Every journal entry must strictly balance, meaning the sum of all debits must exactly equal the sum of all credits.
*   **Balance Integrity:** Debit and credit values must be positive numbers (no negative entry lines allowed).
*   **Read-Only VAT Accounts:** Accounts for VAT Input 5% (Asset) and VAT Output 5% (Liability) are strictly read-only and managed by the system to maintain FTA audit alignment.

---

## 8. Feature Flags = Navbar + Routes + Permissions

*   **Conditional Navigation:** Modular options like inventory management or staff profiles must be dynamically controlled via active company feature flags (e.g., `inventoryEnabled` or `staffEnabled`). Unused segments should be fully hidden from the sidebar to prevent visual clutter.
*   **Routing Protections:** When a module or feature flag is toggled off, any manual route switching or tab-selection targeting that module (e.g., accessing `'inventory'`) must automatically trigger a secure, client-side redirect back to the home or `'dashboard'` tab.
*   **Access Verification:** Always couple user-interface visibility flags with state-level guards to keep the active workspace clean, synchronized, and secure.

---

## 9. Communication Culture

*   **Constructive Collaboration:** All tasks, specifications, and architecture briefs are treated as valuable suggestions. The developer has the full authority to propose and implement superior engineering solutions, optimized user-experience pathways, and robust coding patterns.
*   **Aspiration of Excellence:** The shared goal of the developer and the user is to build the highest-quality, most compliant software product possible. Collaboration must be grounded in constructive design dialogues, professional integrity, and technical excellence over rigid adherence or personal ego.
*   **Collaboration Suggestion Note Rule:** For all future tasks (especially from V2.1.4 onwards), append the following Suggestion Note at the end of task logs and communication:
    > "💡 Suggestion: Ye mera suggestion hai. Agar aap isse behtar tarike se kar sakte ho to please kar dijiye. Hum best UX aur clean code chahte hain. Aap developer hain, aapki expertise important hai."

---

## 10. Data Safety & Migration Integrity during Updates

*   **Zero Corruption / Zero Reset Guarantee:** Under no circumstances should software updates, code refactoring, or layout improvements delete, corrupt, or reset active customer transactional data, customs invoice templates, or system settings.
*   **Code-Only Updates:** All system upgrades must apply exclusively to the code layer. Active user storage, local browser persistence layers (e.g., `localStorage`), and database configurations must remain intact.
*   **Validation & Pre-update Verification:** Prior to deploying any logic or data-structure alterations, rigorous validation of migrations and dry-run backup tests must be carried out to prevent live system data disruption.



