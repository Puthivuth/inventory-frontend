"use client"

import { useRef, useEffect, useState } from "react"
import type { Invoice } from "@/types"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import QRCodeStyling from "qr-code-styling"

interface InvoicePreviewProps {
  invoice: Invoice
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCode = useRef<QRCodeStyling | null>(null)
  const [khqrData, setKhqrData] = useState<any>(null)
  const [loadingQR, setLoadingQR] = useState(false)

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

  // Generate KHQR QR code if payment method is KHQR
  useEffect(() => {
    const generateKHQR = async () => {
      console.log('[Invoice Preview] Checking KHQR generation:', {
        paymentMethod: invoice.paymentMethod,
        status: invoice.status,
        invoiceId: invoice.invoiceId
      })
      
      if (invoice.paymentMethod !== 'KHQR') {
        console.log('[Invoice Preview] Not a KHQR invoice')
        return
      }

      // If already paid, skip
      if (invoice.status?.toLowerCase() === 'paid') {
        console.log('[Invoice Preview] Invoice already paid')
        return
      }

      console.log('[Invoice Preview] Generating KHQR QR code...')
      setLoadingQR(true)
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `http://localhost:8000/api/invoices/${invoice.invoiceId}/generate_khqr/`,
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
          console.log('[Invoice Preview] KHQR data received:', data)
          setKhqrData(data)
        } else {
          console.error('[Invoice Preview] KHQR generation failed:', response.status)
        }
      } catch (error) {
        console.error('[Invoice Preview] Error generating KHQR:', error)
      } finally {
        setLoadingQR(false)
      }
    }

    generateKHQR()
  }, [invoice.invoiceId, invoice.paymentMethod, invoice.status])

  // Check payment status once on page load for pending KHQR invoices
  useEffect(() => {
    const checkPaymentOnLoad = async () => {
      console.log('[Invoice Preview] Payment check triggered:', {
        paymentMethod: invoice.paymentMethod,
        status: invoice.status,
        invoiceId: invoice.invoiceId
      })
      
      if (invoice.paymentMethod !== 'KHQR' || invoice.status?.toLowerCase() !== 'pending') {
        console.log('[Invoice Preview] Skipping payment check - not a pending KHQR invoice')
        return
      }

      console.log('[Invoice Preview] Checking payment status on load...')
      try {
        const token = localStorage.getItem('token')
        console.log('[Invoice Preview] Making API call to check payment...')
        const response = await fetch(
          `http://localhost:8000/api/invoices/${invoice.invoiceId}/check_payment/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        console.log('[Invoice Preview] API response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[Invoice Preview] Payment status:', data)
          if (data.paid) {
            console.log('[Invoice Preview] Payment confirmed! Timestamp:', data.payment_timestamp)
            alert('Payment received! Invoice will be updated.')
            // Refresh the page to show updated status with payment timestamp
            window.location.reload()
          } else {
            console.log('[Invoice Preview] Payment not yet received')
          }
        } else {
          console.error('[Invoice Preview] API call failed:', response.status)
        }
      } catch (error) {
        console.error('[Invoice Preview] Error checking payment:', error)
      }
    }

    checkPaymentOnLoad()
  }, [invoice.invoiceId, invoice.paymentMethod, invoice.status])

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

  const exportToPDF = async () => {
    if (!invoiceRef.current) return

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
    pdf.save(`${invoice.invoiceNumber}.pdf`)
  }

  const exportToPNG = async () => {
    if (!invoiceRef.current) return

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    })

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${invoice.invoiceNumber}.png`
        link.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={exportToPDF} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button onClick={exportToPNG} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export PNG
        </Button>
      </div>

      <div
        ref={invoiceRef}
        style={{
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#2563eb", marginBottom: "0.5rem" }}>
            INVOICE
          </h1>
          <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
            <p style={{ fontFamily: "monospace", fontWeight: "500" }}>{invoice.invoiceNumber}</p>
            <p>Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
          <div>
            <h3 style={{ fontWeight: "600", color: "#111827", marginBottom: "0.5rem" }}>Bill To:</h3>
            <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <p style={{ fontWeight: "500", color: "#111827" }}>{invoice.customerName}</p>
              <p>{invoice.customerEmail}</p>
              <p>{invoice.customerPhone}</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3 style={{ fontWeight: "600", color: "#111827", marginBottom: "0.5rem" }}>From:</h3>
            <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <p style={{ fontWeight: "500", color: "#111827" }}>Your Company Name</p>
              <p>123 Business Street</p>
              <p>City, State 12345</p>
            </div>
          </div>
        </div>

        <table style={{ width: "100%", marginBottom: "2rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #d1d5db" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Item
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Price
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Discount
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.75rem 0", fontSize: "0.875rem" }}>
                  <div style={{ fontWeight: "500", color: "#111827" }}>{item.name}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{item.sku}</div>
                </td>
                <td style={{ textAlign: "right", padding: "0.75rem 0", fontSize: "0.875rem", color: "#4b5563" }}>
                  {item.quantity}
                </td>
                <td style={{ textAlign: "right", padding: "0.75rem 0", fontSize: "0.875rem", color: "#4b5563" }}>
                  ${item.price.toFixed(2)}
                </td>
                <td style={{ textAlign: "right", padding: "0.75rem 0", fontSize: "0.875rem", color: "#4b5563" }}>
                  {item.discount}%
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "0.75rem 0",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  ${item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "16rem" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              <span style={{ color: "#4b5563" }}>Subtotal:</span>
              <span style={{ fontWeight: "500", color: "#111827" }}>${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#4b5563" }}>Discount:</span>
                <span style={{ fontWeight: "500", color: "#dc2626" }}>-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div
              style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              <span style={{ color: "#4b5563" }}>Tax:</span>
              <span style={{ fontWeight: "500", color: "#111827" }}>${invoice.tax.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.125rem",
                fontWeight: "bold",
                borderTop: "2px solid #d1d5db",
                paddingTop: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <span style={{ color: "#111827" }}>Total:</span>
              <span style={{ color: "#2563eb" }}>${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* KHQR QR Code Section */}
        {invoice.paymentMethod === 'KHQR' && invoice.status?.toLowerCase() !== 'paid' && (
          <div style={{ 
            marginTop: "2rem", 
            paddingTop: "2rem", 
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontWeight: "600", color: "#111827", marginBottom: "0.5rem", fontSize: "1.125rem" }}>
                Scan to Pay with KHQR
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Amount: ${invoice.total.toFixed(2)}
              </p>
            </div>
            
            {loadingQR ? (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                padding: "2rem",
                color: "#6b7280"
              }}>
                <span style={{ fontSize: "0.875rem" }}>Generating QR Code...</span>
              </div>
            ) : khqrData ? (
              <div 
                ref={qrRef} 
                style={{ 
                  border: "2px solid #e5e7eb", 
                  borderRadius: "0.5rem", 
                  padding: "1rem",
                  backgroundColor: "#ffffff"
                }}
              />
            ) : (
              <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                Failed to generate QR code
              </div>
            )}
            
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" }}>
              Open your Bakong app and scan this QR code to complete payment
            </p>
          </div>
        )}

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#6b7280",
          }}
        >
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}
