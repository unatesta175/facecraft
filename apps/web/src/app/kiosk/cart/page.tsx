'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, QrCode, CreditCard, Banknote, Check, Tag, Package, Sparkles, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KioskHeader } from '@/components/kiosk/kiosk-header';
import { KioskPageBody, KioskScrollArea, KioskShell, KioskStickyFooter } from '@/components/kiosk/kiosk-shell';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useKioskCart } from '@/hooks/use-kiosk-cart';
import { kioskApi, type KioskOrderResult } from '@/lib/kiosk-api';
import type { KioskCartPackage } from '@/lib/kiosk-cart';
import { kioskBtnPrimary, kioskBtnOutline, kioskCard } from '@/lib/kiosk-ui';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onPaymentSuccess: (order: KioskOrderResult) => void;
  onConfirmPayment: (params: {
    paymentType: 'QR' | 'CARD' | 'CASH';
    staffCode?: string;
  }) => Promise<KioskOrderResult>;
}

function PaymentModal({ total, onClose, onPaymentSuccess, onConfirmPayment }: PaymentModalProps) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'card' | 'cash' | null>(null);
  const [staffId, setStaffId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) return;

    if ((selectedMethod === 'qr' || selectedMethod === 'cash') && !staffId.trim()) {
      toast({
        title: 'Staff ID required',
        description: 'Please enter Staff ID for verification.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const paymentType =
        selectedMethod === 'qr' ? 'QR' : selectedMethod === 'card' ? 'CARD' : 'CASH';
      const order = await onConfirmPayment({
        paymentType,
        staffCode: staffId.trim() || undefined,
      });
      onPaymentSuccess(order);
    } catch {
      setIsProcessing(false);
      toast({
        title: 'Payment failed',
        description: 'Unable to complete payment. Please check staff ID and try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-[--color-gold] px-6 py-5 text-white">
          <h3 className="font-jakarta text-2xl font-bold mb-1">
            Select Payment Method
          </h3>
          <div className="flex items-center gap-2">
            <p className="font-nunito text-sm text-white/90">
              Total Amount:
            </p>
            <p className="font-jakarta text-xl font-bold">
              RM {total.toFixed(2)}
            </p>
          </div>
        </div>

        {isProcessing ? (
          <div className="p-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-[#f0f0f0] rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-4 border-[#c9982f] border-t-transparent rounded-full" />
              </div>
            </motion.div>
            <p className="font-jakarta font-bold text-2xl text-[#1f1b16] mb-2">
              Processing Payment...
            </p>
            <p className="font-nunito text-base text-[#6b6b6b]">
              Please wait while we confirm your payment
            </p>
          </div>
        ) : (
          <>
            {/* Payment Methods */}
            <div className="p-6 md:p-8 space-y-3">
              <button
                onClick={() => setSelectedMethod('qr')}
                className={`w-full p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                  selectedMethod === 'qr'
                    ? 'border-[#c9982f] bg-gradient-to-r from-[#fbf3df] to-[#faf6e8] shadow-md'
                    : 'border-[#f0f0f0] hover:border-[#e0e0e0] bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9982f] to-[#b8872a] flex items-center justify-center shadow-sm">
                    <QrCode className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-jakarta font-bold text-lg text-[#1f1b16]">
                      Scan QR Code
                    </p>
                    <p className="font-nunito text-sm text-[#6b6b6b]">
                      Pay with mobile banking
                    </p>
                  </div>
                  {selectedMethod === 'qr' && (
                    <div className="w-8 h-8 rounded-full bg-[#c9982f] flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('card')}
                className={`w-full p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                  selectedMethod === 'card'
                    ? 'border-[#c9982f] bg-gradient-to-r from-[#fbf3df] to-[#faf6e8] shadow-md'
                    : 'border-[#f0f0f0] hover:border-[#e0e0e0] bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6fcf97] to-[#56b881] flex items-center justify-center shadow-sm">
                    <CreditCard className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-jakarta font-bold text-lg text-[#1f1b16]">
                      Card Payment
                    </p>
                    <p className="font-nunito text-sm text-[#6b6b6b]">
                      Credit or debit card
                    </p>
                  </div>
                  {selectedMethod === 'card' && (
                    <div className="w-8 h-8 rounded-full bg-[#6fcf97] flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('cash')}
                className={`w-full p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                  selectedMethod === 'cash'
                    ? 'border-[#c9982f] bg-gradient-to-r from-[#fbf3df] to-[#faf6e8] shadow-md'
                    : 'border-[#f0f0f0] hover:border-[#e0e0e0] bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9b87f5] to-[#7e69d6] flex items-center justify-center shadow-sm">
                    <Banknote className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-jakarta font-bold text-lg text-[#1f1b16]">
                      Cash Payment
                    </p>
                    <p className="font-nunito text-sm text-[#6b6b6b]">
                      Pay with cash at counter
                    </p>
                  </div>
                  {selectedMethod === 'cash' && (
                    <div className="w-8 h-8 rounded-full bg-[#9b87f5] flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* Staff ID Verification */}
              <AnimatePresence>
                {(selectedMethod === 'qr' || selectedMethod === 'cash') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#fafafa] p-6 rounded-2xl border border-[#f0f0f0]"
                  >
                    <p className="font-nunito text-sm text-[#1f1b16] mb-3 font-medium">
                      Kindly enter the staff ID or scan the staff's QR Code for verification
                    </p>
                    <Input
                      placeholder="Enter Staff ID..."
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="font-jakarta text-base h-12 bg-white border-[#e0e0e0] focus:border-[#c9982f]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="px-6 md:px-8 pb-6 md:pb-8 flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                size="lg"
                className="flex-1 font-jakarta border-2 border-[#e0e0e0] text-[#1f1b16] hover:text-[#1f1b16] hover:bg-[#fafafa] hover:border-[#c9982f] py-6 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!selectedMethod}
                size="lg"
                className={`flex-1 rounded-2xl py-5 ${kioskBtnPrimary}`}
              >
                Confirm Payment
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hydrated, items: cartItems, removeFromCart, clearCart } = useKioskCart();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<KioskOrderResult | null>(null);
  const [paymentDate, setPaymentDate] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const discount = appliedDiscount ? Math.min(appliedDiscount.amount, subtotal) : 0;
  const total = Math.max(0, subtotal - discount);

  const handleRemoveItem = (item: KioskCartPackage) => {
    removeFromCart(item.id);
    if (cartItems.length === 1) {
      setAppliedDiscount(null);
      setDiscountCode('');
    }
    toast({
      title: 'Removed from cart',
      description: `${item.name} has been removed from your cart.`,
    });
  };

  const handleApplyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) {
      toast({
        title: 'Enter a code',
        description: 'Please enter a discount code before applying.',
        variant: 'destructive',
      });
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const response = await kioskApi.validateDiscount(code);
      const discountData = response.data;
      if (!discountData) {
        throw new Error('Invalid discount');
      }

      setAppliedDiscount({
        code: discountData.code,
        amount: discountData.amount,
      });
      toast({
        title: 'Discount applied!',
        description: `RM ${Math.min(discountData.amount, subtotal).toFixed(2)} off has been applied to your order.`,
      });
    } catch {
      setAppliedDiscount(null);
      toast({
        title: 'Invalid code',
        description: 'The discount code you entered is not valid.',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const buildCheckoutPayload = () => {
    const session = kioskApi.getSession();
    if (!session) {
      throw new Error('Kiosk session not found');
    }

    return {
      kioskId: session.id,
      discountCode: appliedDiscount?.code,
      items: cartItems.map((item) => ({
        packageId: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        products: item.products.map((product) => ({
          productId: product.id,
          name: product.name,
          photoCount: product.photoCount,
          quantity: product.quantity,
          assignments: product.assignments.map((assignment) => ({
            imageId: assignment.imageId,
            imageUrl: assignment.imageUrl,
            filename: assignment.filename,
          })),
        })),
      })),
    };
  };

  const handleConfirmPayment = async ({
    paymentType,
    staffCode,
  }: {
    paymentType: 'QR' | 'CARD' | 'CASH';
    staffCode?: string;
  }) => {
    const response = await kioskApi.createOrder({
      ...buildCheckoutPayload(),
      paymentType,
      staffCode,
    });

    if (!response.data) {
      throw new Error('Order creation failed');
    }

    return response.data;
  };

  const handlePaymentSuccess = (order: KioskOrderResult) => {
    setCompletedOrder(order);
    setPaymentDate(
      new Date().toLocaleString('en-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
    setShowPaymentModal(false);
    setShowReceipt(true);
    clearCart();
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (!hydrated) {
    return (
      <KioskShell fixed className="items-center justify-center">
        <p className="font-nunito text-sm text-[--color-text-secondary]">Loading cart...</p>
      </KioskShell>
    );
  }

  if (showReceipt && completedOrder) {
    const receiptItems = completedOrder.items;
    const receiptSubtotal = completedOrder.subtotal;
    const receiptDiscount = completedOrder.discount;
    const receiptTotal = completedOrder.price;
    const orderNumber = completedOrder.orderCode;
    return (
      <>
        {/* Print-only Receipt - Hidden on screen */}
        <div className="print:block hidden">
          <div style={{ maxWidth: '80mm', margin: '0 auto', padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px dashed #000', paddingBottom: '15px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>FACECRAFT</h1>
              <p style={{ margin: '5px 0', fontSize: '11px' }}>Photo Kiosk Service</p>
              <p style={{ margin: '5px 0', fontSize: '11px' }}>Thank you for your order!</p>
            </div>

            {/* Order Info */}
            <div style={{ marginBottom: '20px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Order #:</span>
                <strong>{orderNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Date:</span>
                <span>{paymentDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment:</span>
                <span>{completedOrder.paymentType} - PAID</span>
              </div>
            </div>

            {/* Items */}
            <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '15px 0', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>ORDER DETAILS</h3>
              {receiptItems.map((item, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong>{item.name}</strong>
                    <strong>RM {item.price.toFixed(2)}</strong>
                  </div>
                  {item.description ? (
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
                      {item.description}
                    </div>
                  ) : null}
                  <div style={{ fontSize: '10px', marginLeft: '10px' }}>
                    {item.products.map((product, productIndex) => (
                      <div key={`${product.name}-${productIndex}`} style={{ marginBottom: '3px' }}>
                        • {product.assignments.length}/{product.photoCount} {product.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ marginBottom: '20px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Subtotal:</span>
                <span>RM {receiptSubtotal.toFixed(2)}</span>
              </div>
              {receiptDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#28a745' }}>
                  <span>Discount:</span>
                  <span>-RM {receiptDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px solid #000' }}>
                <span>TOTAL PAID:</span>
                <span>RM {receiptTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{ textAlign: 'center', borderTop: '2px dashed #000', paddingTop: '20px', marginTop: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>DIGITAL PHOTOS</h3>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                margin: '0 auto 15px', 
                border: '2px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff'
              }}>
                {/* QR Code placeholder - in real implementation, use a QR code library */}
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  backgroundColor: '#000',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: '1px'
                }}>
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} style={{ 
                      backgroundColor: Math.random() > 0.5 ? '#000' : '#fff',
                      width: '100%',
                      height: '100%'
                    }} />
                  ))}
                </div>
              </div>
              <p style={{ fontSize: '10px', margin: '10px 0' }}>
                Scan to access your digital photos
              </p>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: '#666' }}>
              <p style={{ margin: '5px 0' }}>This is your official receipt</p>
              <p style={{ margin: '5px 0' }}>Please keep for your records</p>
              <p style={{ margin: '15px 0 5px', fontWeight: 'bold' }}>Visit us again!</p>
            </div>
          </div>
        </div>

        {/* Screen Display */}
        <div className="print:hidden">
        <KioskShell fixed className="bg-white">
          <KioskHeader title="Payment Complete" subtitle="Your order is confirmed" />
          <KioskPageBody className="px-4 py-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${kioskCard} flex min-h-0 flex-1 flex-col overflow-hidden shadow-md`}
            >
              <div className="shrink-0 border-b border-[--color-border] bg-[--color-success-bg] p-5 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[--color-success-text] shadow-md">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-jakarta text-xl font-bold text-[--color-text-primary]">
                  Payment Successful!
                </h3>
                <p className="mt-1 font-nunito text-sm text-[--color-text-secondary]">
                  Order {orderNumber}
                </p>
              </div>

              <KioskScrollArea className="p-4">
                <div className="mb-4 rounded-xl border border-[--color-border] bg-[--color-surface-muted] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-nunito text-sm text-[--color-text-secondary]">Total Paid</span>
                    <span className="font-jakarta text-xl font-bold text-[--color-gold]">
                      RM {receiptTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mb-4 text-center">
                  <div className="mb-2 inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[--color-gold]" />
                    <p className="font-jakarta text-sm font-semibold">Digital Photos</p>
                  </div>
                  <div className="rounded-xl border-2 border-dashed border-[--color-border] bg-[--color-surface-muted] p-6">
                    <QrCode className="mx-auto h-24 w-24 text-[--color-gold]" />
                  </div>
                  <p className="mt-3 font-nunito text-xs text-[--color-text-secondary]">
                    Scan to access your digital photos
                  </p>
                </div>
              </KioskScrollArea>

              <div className="shrink-0 space-y-2 border-t border-[--color-border] p-4">
                <Button
                  onClick={handlePrintReceipt}
                  variant="outline"
                  className={`h-12 w-full rounded-2xl ${kioskBtnOutline}`}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
                <Button
                  onClick={() => router.push('/kiosk/home')}
                  className={`h-14 w-full rounded-2xl ${kioskBtnPrimary}`}
                >
                  Return to Home
                </Button>
              </div>
            </motion.div>
          </KioskPageBody>
        </KioskShell>
        </div>
      </>
    );
  }

  return (
    <KioskShell fixed className="bg-white">
      <KioskHeader
        title="Your Cart"
        subtitle="Review before checkout"
        onBack={() => router.back()}
      />

      <KioskPageBody>
        <KioskScrollArea className="px-4 py-3">
          <div className="space-y-4 pb-4">
            <div className={`${kioskCard} p-4`}>
              <h3 className="mb-4 flex items-center gap-2 font-jakarta text-base font-bold">
                <ShoppingCart className="h-4 w-4 text-[--color-gold]" />
                Order Items
              </h3>

              {cartItems.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-[--color-gold]" />
                  <p className="font-jakarta font-semibold">Your cart is empty</p>
                  <p className="mb-4 font-nunito text-xs text-[--color-text-secondary]">
                    Add packages from the shop
                  </p>
                  <Button
                    onClick={() => router.push('/kiosk/shop')}
                    className={`rounded-xl ${kioskBtnPrimary}`}
                  >
                    Back to Shop
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="border-b border-[--color-border] pb-4 last:border-0 last:pb-0">
                      <div className="flex gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[--color-gold-tint]">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-7 w-7 text-[--color-gold]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-jakarta text-sm font-bold">{item.name}</h4>
                              {item.description ? (
                                <p className="font-nunito text-xs text-[--color-text-secondary]">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item)}
                              className="h-8 w-8 shrink-0 text-[--color-danger-text] hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {item.products.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-surface-muted] p-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-jakarta text-xs font-semibold">{product.name}</p>
                                  <p className="font-nunito text-[10px] text-[--color-text-secondary]">
                                    {product.assignments.length}/{product.photoCount} photos
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-[10px]">
                                  Qty {product.quantity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-right font-jakarta text-base font-bold text-[--color-gold]">
                            RM {item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 ? (
              <>
                <div className={`${kioskCard} p-4`}>
                  <label className="mb-3 flex items-center gap-2 font-jakarta text-sm font-semibold">
                    <Tag className="h-4 w-4 text-[--color-gold]" />
                    Discount Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleApplyDiscount();
                      }}
                      className="h-11 flex-1 bg-[--color-surface-muted] border-[--color-border]"
                    />
                    <Button
                      onClick={() => void handleApplyDiscount()}
                      disabled={isApplyingDiscount}
                      className={`h-11 rounded-xl px-4 ${kioskBtnPrimary}`}
                    >
                      {isApplyingDiscount ? '...' : 'Apply'}
                    </Button>
                  </div>
                  {appliedDiscount ? (
                    <p className="mt-2 font-nunito text-xs text-[--color-success-text]">
                      Code {appliedDiscount.code} applied
                    </p>
                  ) : null}
                </div>

                <div className={`${kioskCard} p-4`}>
                  <h3 className="mb-3 font-jakarta text-sm font-bold">Order Summary</h3>
                  <div className="space-y-2 font-nunito text-sm">
                    <div className="flex justify-between">
                      <span className="text-[--color-text-secondary]">Subtotal</span>
                      <span className="font-jakarta font-semibold">RM {subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 ? (
                      <div className="flex justify-between text-[--color-success-text]">
                        <span>Discount</span>
                        <span className="font-jakarta font-semibold">-RM {discount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between border-t border-[--color-border] pt-2">
                      <span className="font-jakarta font-bold">Total</span>
                      <span className="font-jakarta text-xl font-bold text-[--color-gold]">
                        RM {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </KioskScrollArea>
      </KioskPageBody>

      {cartItems.length > 0 ? (
        <KioskStickyFooter>
          <Button
            onClick={() => setShowPaymentModal(true)}
            className={`h-14 w-full rounded-2xl text-base ${kioskBtnPrimary}`}
          >
            Proceed to Payment · RM {total.toFixed(2)}
          </Button>
        </KioskStickyFooter>
      ) : null}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            total={total}
            onClose={() => setShowPaymentModal(false)}
            onConfirmPayment={handleConfirmPayment}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </KioskShell>
  );
}
