import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'gemini-parse-plugin',
        configureServer(server) {
          server.middlewares.use('/api/gemini/parse', async (req, res, next) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            try {
              // Read JSON body
              const body = await new Promise<any>((resolve, reject) => {
                let chunk = '';
                req.on('data', c => { chunk += c; });
                req.on('end', () => {
                  try {
                    resolve(JSON.parse(chunk));
                  } catch (e) {
                    reject(e);
                  }
                });
                req.on('error', e => reject(e));
              });

              const { fileData, mimeType, fileText, fileName } = body;
              const ai = getGeminiClient();

              const prompt = `
                You are an elite financial auditor and CPA. Your job is to extract financial data from the provided accounting report/document (such as an invoice, client list, expense/supplier bill, or chart of accounts from any software like industry standard accounting software, Excel printouts, etc.) and map them precisely to Hisaab Pro's internal data models.
                
                Analyzing file: "${fileName || 'uploaded_document'}"
                
                Please determine the document type from the data:
                - 'invoices' (Sales Invoices or Quotations)
                - 'customers' (Client or Customer directory list)
                - 'expenses' (Expenses, Supplier invoices, purchases, payments to vendors)
                - 'coa_accounts' (Chart of accounts class categories, ledger names)
                
                And map them to the corresponding arrays in the response schema. Format currency numbers precisely, keep dates in YYYY-MM-DD format (or provide a valid current date if not specified), and check UAE TRN compliance. Ensure TRNs are exactly 15 digits long if provided, and flag any errors.
              `;

              const contents: any[] = [prompt];
              if (fileData && mimeType) {
                contents.push({
                  inlineData: {
                    data: fileData,
                    mimeType: mimeType
                  }
                });
              } else if (fileText) {
                contents.push(fileText);
              }

              const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: contents,
                config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      documentType: {
                        type: Type.STRING,
                        description: "One of 'invoices', 'customers', 'expenses', 'coa_accounts', or 'unknown'"
                      },
                      confidence: {
                        type: Type.INTEGER,
                        description: "Confidence rating from 0 to 100"
                      },
                      summary: {
                        type: Type.STRING,
                        description: "A summary sentence describing the extracted records"
                      },
                      invoices: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            invoiceNo: { type: Type.STRING },
                            clientName: { type: Type.STRING },
                            clientTrn: { type: Type.STRING },
                            date: { type: Type.STRING },
                            dueDate: { type: Type.STRING },
                            subtotal: { type: Type.NUMBER },
                            vatAmount: { type: Type.NUMBER },
                            total: { type: Type.NUMBER },
                            status: { type: Type.STRING, description: "'Paid' or 'Unpaid'" },
                            items: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  description: { type: Type.STRING },
                                  qty: { type: Type.NUMBER },
                                  rate: { type: Type.NUMBER },
                                  vatPct: { type: Type.NUMBER },
                                  total: { type: Type.NUMBER }
                                },
                                required: ["description", "qty", "rate", "total"]
                              }
                            }
                          },
                          required: ["invoiceNo", "clientName", "total"]
                        }
                      },
                      customers: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            email: { type: Type.STRING },
                            phone: { type: Type.STRING },
                            address: { type: Type.STRING },
                            emirate: { type: Type.STRING },
                            trn: { type: Type.STRING },
                            status: { type: Type.STRING, description: "'Active' or 'Inactive'" }
                          },
                          required: ["name"]
                        }
                      },
                      expenses: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            supplierName: { type: Type.STRING },
                            supplierTrn: { type: Type.STRING },
                            date: { type: Type.STRING },
                            category: { type: Type.STRING },
                            amount: { type: Type.NUMBER },
                            vatAmount: { type: Type.NUMBER },
                            total: { type: Type.NUMBER },
                            status: { type: Type.STRING, description: "'Paid' or 'Unpaid'" }
                          },
                          required: ["supplierName", "total"]
                        }
                      },
                      coa_accounts: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            code: { type: Type.STRING },
                            name: { type: Type.STRING },
                            type: { type: Type.STRING, description: "One of 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'" },
                            description: { type: Type.STRING },
                            balance: { type: Type.NUMBER }
                          },
                          required: ["code", "name", "type"]
                        }
                      }
                    },
                    required: ["documentType", "confidence", "summary"]
                  }
                }
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(response.text);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
