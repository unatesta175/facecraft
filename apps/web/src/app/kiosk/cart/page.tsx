'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, QrCode, CreditCard, Banknote, Check, ArrowLeft, Tag, Package, Sparkles, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Mock cart data
const CART_ITEMS = [
  {
    id: 'pkg-1',
    name: 'Classic Memories',
    description: 'Perfect for capturing special moments',
    price: 299,
    quantity: 1,
    image: '/packages/classic.png',
    products: [
      { name: '8x10 Print', count: 2 },
      { name: '5x7 Print', count: 2 },
      { name: 'Digital Copy', count: 1 },
    ],
  },
];

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

function PaymentModal({ total, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'card' | 'cash' | null>(null);
  const [staffId, setStaffId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    if ((selectedMethod === 'qr' || selectedMethod === 'cash') && !staffId) {
      alert('Please enter Staff ID');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      onPaymentSuccess();
    }, 2000);
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
        <div className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] px-6 md:px-8 py-6 text-white">
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
                className="flex-1 bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta py-6 rounded-2xl disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
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
  const [cartItems] = useState(CART_ITEMS);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount;

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleApplyDiscount = () => {
    // Mock discount validation
    if (discountCode.toUpperCase() === 'SAVE10') {
      setDiscount(subtotal * 0.1);
      toast({
        title: 'Discount applied!',
        description: '10% discount has been applied to your order',
      });
    } else {
      toast({
        title: 'Invalid code',
        description: 'The discount code you entered is not valid',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSuccess = () => {
    const newOrderNumber = `FC${Date.now().toString().slice(-6)}`;
    const newPaymentDate = new Date().toLocaleString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setOrderNumber(newOrderNumber);
    setPaymentDate(newPaymentDate);
    setShowPaymentModal(false);
    setShowReceipt(true);
  };

  if (showReceipt) {
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
                <span>PAID</span>
              </div>
            </div>

            {/* Items */}
            <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '15px 0', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>ORDER DETAILS</h3>
              {cartItems.map((item, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong>{item.name}</strong>
                    <strong>RM {item.price.toFixed(2)}</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '10px', marginLeft: '10px' }}>
                    {item.products.map((product, idx) => (
                      <div key={idx} style={{ marginBottom: '3px' }}>
                        • {product.count}x {product.name}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '5px', marginLeft: '10px' }}>
                    Quantity: {item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ marginBottom: '20px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Subtotal:</span>
                <span>RM {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#28a745' }}>
                  <span>Discount:</span>
                  <span>-RM {discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px solid #000' }}>
                <span>TOTAL PAID:</span>
                <span>RM {total.toFixed(2)}</span>
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
        <div className="print:hidden min-h-screen bg-[#f9f9f7] flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Success Header */}
          <div className="bg-gradient-to-br from-[#eef3e3] to-[#e0ead1] p-8 text-center border-b border-[#d0e0b8]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6fcf97] to-[#56b881] flex items-center justify-center shadow-lg"
            >
              <Check className="h-10 w-10 text-white" />
            </motion.div>

            <h3 className="font-jakarta text-3xl font-bold text-[#1f1b16] mb-2">
              Payment Successful!
            </h3>
            <p className="font-nunito text-base text-[#6b6b6b]">
              Your order has been confirmed
            </p>
          </div>

          <div className="p-8">
            {/* Order Details */}
            <div className="bg-[#fafafa] rounded-2xl p-6 mb-6 border border-[#f0f0f0]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-nunito text-sm text-[#6b6b6b]">Order Number</span>
                <span className="font-jakarta text-lg font-bold text-[#1f1b16]">{orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-nunito text-sm text-[#6b6b6b]">Total Paid</span>
                <span className="font-jakarta text-xl font-bold bg-gradient-to-r from-[#c9982f] to-[#b8872a] bg-clip-text text-transparent">
                  RM {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* QR Code for Digital Photos */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-[#c9982f]" />
                <p className="font-jakarta font-semibold text-base text-[#1f1b16]">
                  Your Digital Photos
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-[#f0f0f0] shadow-sm mb-4">
                <div className="w-48 h-48 mx-auto bg-[#fafafa] rounded-xl flex items-center justify-center border-2 border-dashed border-[#e0e0e0]">
                  <QrCode className="h-32 w-32 text-[#c9982f]" />
                </div>
              </div>
              <p className="font-nunito text-sm text-[#6b6b6b] leading-relaxed">
                Scan this QR code to access and download your digital photos instantly
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handlePrintReceipt}
                variant="outline"
                className="w-full font-jakarta border-2 border-[#e0e0e0] text-[#1f1b16] hover:text-[#1f1b16] hover:bg-[#fafafa] hover:border-[#c9982f] py-6 rounded-2xl"
              >
                <Printer className="mr-2 h-5 w-5" />
                Print Receipt
              </Button>
              
              <Button
                onClick={() => router.push('/kiosk/home')}
                className="w-full bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta py-6 rounded-2xl shadow-md hover:shadow-lg transition-all"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </motion.div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4 text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-[#f5f5f5] rounded-xl transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
          <h2 className="font-jakarta text-3xl md:text-4xl font-bold text-[#1f1b16] mb-2">
            Your Cart
          </h2>
          <p className="font-nunito text-base md:text-lg text-[#6b6b6b]">
            Review your order before checkout
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-[#f0f0f0]"
            >
              <h3 className="font-jakarta text-xl font-bold text-[#1f1b16] mb-6 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#c9982f]" />
                Order Items
              </h3>

              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="group"
                  >
                    <div className="flex items-start gap-4 pb-4 border-b border-[#f0f0f0]">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#fbf3df] to-[#f7f0d8] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Package className="h-10 w-10 md:h-12 md:w-12 text-[#c9982f]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h4 className="font-jakarta text-lg md:text-xl font-bold text-[#1f1b16] mb-1">
                              {item.name}
                            </h4>
                            <p className="font-nunito text-sm text-[#6b6b6b]">
                              {item.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#ff6b6b] hover:text-[#ee5a52] hover:bg-[#fff0f0] rounded-xl flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </div>

                        {/* Product List */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.products.map((product, idx) => (
                            <Badge
                              key={idx}
                              className="bg-[#fafafa] text-[#1f1b16] border border-[#e0e0e0] font-nunito text-xs"
                            >
                              {product.count}x {product.name}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge className="bg-gradient-to-r from-[#fbf3df] to-[#f7f0d8] text-[#8a6a1f] border-[#e0d0a0] font-nunito">
                            Quantity: {item.quantity}
                          </Badge>
                          <span className="font-jakarta text-xl md:text-2xl font-bold bg-gradient-to-r from-[#c9982f] to-[#b8872a] bg-clip-text text-transparent">
                            RM {item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Discount Code */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-6 shadow-md border border-[#f0f0f0]"
              >
                <label className="font-jakarta font-semibold text-base text-[#1f1b16] mb-4 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#c9982f]" />
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 font-jakarta h-11 bg-[#fafafa] border-[#e0e0e0] focus:border-[#c9982f]"
                  />
                  <Button
                    onClick={handleApplyDiscount}
                    className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta px-6 rounded-xl shadow-sm"
                  >
                    Apply
                  </Button>
                </div>
              </motion.div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-6 shadow-md border border-[#f0f0f0]"
              >
                <h3 className="font-jakarta text-lg font-bold text-[#1f1b16] mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-nunito text-[#6b6b6b]">Subtotal</span>
                    <span className="font-jakarta font-semibold text-[#1f1b16]">
                      RM {subtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-[#56b881]">
                      <span className="font-nunito">Discount</span>
                      <span className="font-jakarta font-semibold">
                        -RM {discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-[#f0f0f0]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-jakarta text-base font-bold text-[#1f1b16]">
                        Total Amount
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-jakarta text-3xl font-bold bg-gradient-to-r from-[#c9982f] to-[#b8872a] bg-clip-text text-transparent">
                        RM {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full mt-6 bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta text-lg py-7 rounded-2xl shadow-md hover:shadow-lg transition-all"
                >
                  Proceed to Payment
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            total={total}
            onClose={() => setShowPaymentModal(false)}
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
    </div>
  );
}
