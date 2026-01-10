"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Download } from "lucide-react"
import QRCodeStyling from "qr-code-styling"

interface Invoice {
  id: string
  invoiceId?: number
  invoiceNumber: string
  customerName: string
  customerPhone?: string
  total: number
  subtotal: number
  tax: number
  discount: number
  status: string
  paymentMethod: string
  createdAt: string
  note?: string | null
  items: Purchase[]
}

interface Purchase {
  id: string
  name: string
  quantity: number
  price: number
  discount: number
  total: number
}

interface InvoiceGeneratorProps {
  invoice: Invoice
  onClose: () => void
}

export function InvoiceGenerator({ invoice, onClose }: InvoiceGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [khqrData, setKhqrData] = useState<any>(null)
  const [loadingQR, setLoadingQR] = useState(false)
  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
  })
  const printRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCode = useRef<QRCodeStyling | null>(null)

  // Initialize QR Code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      qrCode.current = new QRCodeStyling({
        width: 200,
        height: 200,
        type: "svg",
        data: "",
        dotsOptions: {
          color: "#000000",
          type: "rounded"
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 5
        }
      })
    }
  }, [])

  useEffect(() => {
    fetchUserProfile()
    
    // Generate KHQR if payment method is 'KHQR'
    if (invoice.paymentMethod === 'KHQR' && invoice.status !== 'paid') {
      generateKHQR()
    }
  }, [invoice.id, invoice.paymentMethod, invoice.status])

  // Update QR code when KHQR data changes
  useEffect(() => {
    if (khqrData?.qr_string && qrCode.current && qrRef.current) {
      qrCode.current.update({
        data: khqrData.qr_string
      })
      qrRef.current.innerHTML = ""
      qrCode.current.append(qrRef.current)
    }
  }, [khqrData?.qr_string])

  const generateKHQR = async () => {
    if (!invoice.invoiceId) return
    console.log('[Invoice Generator] Generating KHQR for invoice:', invoice.invoiceId)
    setLoadingQR(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `https://vuthserver.tailf87741.ts.net/api/invoices/${invoice.invoiceId}/generate_khqr/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('[Invoice Generator] KHQR data received:', data)
        setKhqrData(data)
      } else {
        console.error('[Invoice Generator] KHQR generation failed:', response.status)
      }
    } catch (error) {
      console.error('[Invoice Generator] Error generating KHQR:', error)
    } finally {
      setLoadingQR(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://vuthserver.tailf87741.ts.net/api/user-profiles/", {
        headers: { Authorization: `Token ${token}` },
      })
      if (response.ok) {
        const profiles = await response.json()
        if (profiles.length > 0) {
          const profile = profiles[0]
          setBusinessInfo({
            businessName: profile.businessName || "Your Business",
            businessAddress: profile.businessAddress || "",
            businessPhone: profile.businessPhone || "",
          })
          if (profile.qrCodeImage) {
            setQrCodeUrl(profile.qrCodeImage)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice INV-${invoice.invoiceId}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 40px;
                  color: #333;
                }
                .invoice-header {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #333;
                  padding-bottom: 20px;
                }
                .company-info h1 {
                  margin: 0;
                  font-size: 28px;
                  color: #EA580C;
                }
                .invoice-details {
                  text-align: right;
                }
                .invoice-to {
                  margin: 30px 0;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                th {
                  background-color: #f5f5f5;
                  padding: 12px;
                  text-align: left;
                  border-bottom: 2px solid #ddd;
                }
                td {
                  padding: 10px 12px;
                  border-bottom: 1px solid #eee;
                }
                .text-right {
                  text-align: right;
                }
                .totals {
                  margin-top: 30px;
                  float: right;
                  width: 300px;
                }
                .totals-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 8px 0;
                }
                .grand-total {
                  font-weight: bold;
                  font-size: 18px;
                  border-top: 2px solid #333;
                  padding-top: 10px;
                  margin-top: 10px;
                }
                .qr-section {
                  clear: both;
                  margin-top: 50px;
                  text-align: center;
                  padding-top: 30px;
                  border-top: 1px solid #ddd;
                }
                .qr-section img {
                  max-width: 200px;
                  max-height: 200px;
                }
                .notes {
                  margin-top: 30px;
                  clear: both;
                }
                @media print {
                  body {
                    padding: 20px;
                  }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="p-8 bg-white">
          <div className="invoice-header flex justify-between mb-8 pb-6 border-b-2 border-gray-800">
            <div className="company-info">
              <h1 className="text-3xl font-bold text-orange-600 mb-2">{businessInfo.businessName}</h1>
              {businessInfo.businessAddress && <p className="text-sm">{businessInfo.businessAddress}</p>}
              {businessInfo.businessPhone && <p className="text-sm">Phone: {businessInfo.businessPhone}</p>}
            </div>
            <div className="invoice-details text-right">
              <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
              <p className="text-sm"><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
              <p className="text-sm"><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p className="text-sm"><strong>Status:</strong> <span className={invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>{invoice.status}</span></p>
            </div>
          </div>

          <div className="invoice-to mb-8">
            <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
            <p className="font-medium">{invoice.customerName}</p>
            {invoice.customerPhone && <p className="text-sm text-gray-600">{invoice.customerPhone}</p>}
          </div>

          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-center">Quantity</th>
                <th className="text-right">Price</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td>{item.name || 'Unknown Product'}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">${item.price.toFixed(2)}</td>
                  <td className="text-right">${item.discount.toFixed(2)}</td>
                  <td className="text-right font-medium">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals mt-8 float-right w-80">
            <div className="totals-row flex justify-between py-2">
              <span>Subtotal:</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="totals-row flex justify-between py-2">
              <span>Discount:</span>
              <span>-${invoice.discount.toFixed(2)}</span>
            </div>
            <div className="totals-row flex justify-between py-2">
              <span>Tax:</span>
              <span>${invoice.tax.toFixed(2)}</span>
            </div>
            <div className="grand-total totals-row flex justify-between py-3 mt-3 border-t-2 border-gray-800 text-lg font-bold">
              <span>Grand Total:</span>
              <span>${invoice.total.toFixed(2)}</span>
            </div>
          </div>

          {invoice.note && (
            <div className="notes mt-12 clear-both">
              <h3 className="font-semibold mb-2">Notes:</h3>
              <p className="text-sm text-gray-600">{invoice.note}</p>
            </div>
          )}

          {/* Dynamic KHQR QR Code for KHQR payments */}
          {invoice.paymentMethod === 'KHQR' && invoice.status !== 'paid' && (
            <div className="qr-section mt-12 clear-both text-center pt-8 border-t">
              <p className="text-sm mb-2 font-medium">Scan to Pay with KHQR:</p>
              <p className="text-lg font-bold mb-4">${invoice.total.toFixed(2)}</p>
              {loadingQR ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-gray-500">Generating QR Code...</span>
                </div>
              ) : khqrData ? (
                <div ref={qrRef} className="inline-block border-2 border-gray-200 rounded-lg p-4" />
              ) : (
                <div className="text-sm text-gray-500">Failed to generate QR code</div>
              )}
              <p className="text-xs text-gray-500 mt-4">Open your Bakong app and scan this QR code</p>
            </div>
          )}

          {/* Static QR Code for non-KHQR payments */}
          {invoice.paymentMethod !== 'KHQR' && qrCodeUrl && (
            <div className="qr-section mt-12 clear-both text-center pt-8 border-t">
              <p className="text-sm mb-4 font-medium">Scan to Pay:</p>
              <img src={qrCodeUrl} alt="Payment QR Code" className="mx-auto max-w-[200px] max-h-[200px]" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-orange-600 hover:bg-orange-700">
            <Download className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
