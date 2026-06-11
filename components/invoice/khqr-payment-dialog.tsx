"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  QrCode,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { useRef } from "react";

interface KHQRPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    invoiceId?: number;
    grandTotal?: number;
    total?: number;
    customerName: string;
    status: string;
  };
  onPaymentSuccess?: () => void;
}

interface PaymentStatus {
  success: boolean;
  paid: boolean;
  payment_data?: any;
  invoice_status?: string;
  qr_string?: string;
  qr_image?: string;
  deeplink?: string;
  md5_hash?: string;
}

export function KHQRPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onPaymentSuccess,
}: KHQRPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const isPending = invoice.status?.toLowerCase() === "pending";

  // Initialize QR Code - use standard square dots for Bakong scanner compatibility
  useEffect(() => {
    if (typeof window !== "undefined") {
      qrCode.current = new QRCodeStyling({
        width: 300,
        height: 300,
        type: "canvas",
        data: "",
        dotsOptions: {
          color: "#000000",
          type: "square",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
      });
    }
  }, []);

  // Update QR code when payment data changes
  useEffect(() => {
    if (paymentData?.qr_string && qrCode.current && qrRef.current) {
      qrCode.current.update({
        data: paymentData.qr_string,
      });
      qrRef.current.innerHTML = "";
      qrCode.current.append(qrRef.current);
    }
  }, [paymentData?.qr_string]);

  // Generate KHQR QR code
  const generateQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.invoiceId}/generate_khqr/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate QR code");
      }

      const data = await response.json();
      setPaymentData(data);

      // Start polling for payment status
      startPaymentPolling();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate QR code",
      );
      console.error("Error generating QR code:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    setChecking(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.invoiceId}/check_payment/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to check payment status");
      }

      const data: PaymentStatus = await response.json();

      if (data.paid) {
        setIsPaid(true);
        stopPaymentPolling();

        // Call success callback after a short delay
        setTimeout(() => {
          onPaymentSuccess?.();
          onOpenChange(false);
        }, 2000);
      }

      return data.paid;
    } catch (err) {
      console.error("Error checking payment:", err);
      return false;
    } finally {
      setChecking(false);
    }
  };

  // Start polling for payment
  const startPaymentPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }

    // Poll every 3 seconds
    pollInterval.current = setInterval(() => {
      checkPaymentStatus();
    }, 3000);
  };

  // Stop polling
  const stopPaymentPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPaymentPolling();
    };
  }, []);

  // Generate QR code when dialog opens
  useEffect(() => {
    if (open && !paymentData && !isPaid && isPending) {
      generateQRCode();
    }
  }, [open, isPending, paymentData, isPaid]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      stopPaymentPolling();
      setPaymentData(null);
      setIsPaid(false);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            KHQR Payment
          </DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoiceId} - {invoice.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Display */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-3xl font-bold">
                  ${(invoice.grandTotal || invoice.total || 0).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Generating QR Code...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive text-center">{error}</p>
                <Button
                  onClick={generateQRCode}
                  className="w-full mt-4"
                  variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success/Paid State */}
          {isPaid && (
            <Card className="border-green-500">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">
                      Payment Successful!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Invoice has been marked as paid
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Display */}
          {!loading && !error && !isPaid && paymentData && (
            <div className="space-y-4">
              {/* QR Code */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <p className="text-sm font-medium">Scan with Bakong App</p>
                    {paymentData.qr_image ? (
                      <img
                        src={paymentData.qr_image}
                        alt="KHQR Payment QR Code"
                        className="w-full max-w-xs h-auto object-contain rounded-lg shadow-sm border border-gray-200"
                      />
                    ) : (
                      <div
                        ref={qrRef}
                        className="w-full max-w-xs border border-gray-200 rounded-lg p-2 bg-white shadow-sm"
                      />
                    )}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <RefreshCw
                          className={`h-3 w-3 ${checking ? "animate-spin" : ""}`}
                        />
                        Auto-checking payment status...
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Open your Bakong app and scan this QR code
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deeplink Button */}
              {paymentData.deeplink && (
                <Button
                  onClick={() => window.open(paymentData.deeplink, "_blank")}
                  className="w-full"
                  variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Bakong App
                </Button>
              )}

              {/* Check Payment Button */}
              <Button
                onClick={checkPaymentStatus}
                disabled={checking}
                className="w-full"
                variant="secondary">
                {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {checking ? "Checking..." : "Check Payment Status"}
                {!checking && <RefreshCw className="ml-2 h-4 w-4" />}
              </Button>

              {/* Manual Mark as Paid Button */}
              <Button
                onClick={async () => {
                  if (
                    confirm(
                      "Have you verified the payment was received in your Bakong account? This will mark the invoice as paid.",
                    )
                  ) {
                    try {
                      const token = localStorage.getItem("token");
                      const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.invoiceId}/mark_as_paid/`,
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Token ${token}`,
                            "Content-Type": "application/json",
                          },
                        },
                      );
                      if (response.ok) {
                        setIsPaid(true);
                        setTimeout(() => {
                          onPaymentSuccess?.();
                          onOpenChange(false);
                        }, 2000);
                      }
                    } catch (err) {
                      console.error("Error marking as paid:", err);
                    }
                  }
                }}
                className="w-full"
                variant="outline">
                ✓ Mark as Paid (Manual)
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Note: Automatic payment verification requires NBC approval for
                your merchant account
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
