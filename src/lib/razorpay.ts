// Opens Razorpay's payment window. Only used when online payments are switched on (see the server).
export interface RazorpayPayload { keyId: string; orderId: string; amount: number }
export interface RazorpayResult { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load the payment window. Check your internet and try again.'))
    document.body.appendChild(s)
  })
}

export async function openRazorpay(
  p: RazorpayPayload,
  opts: { name: string; phone?: string; email?: string; description: string }
): Promise<RazorpayResult | null> {
  await loadScript()
  return new Promise((resolve) => {
    const rz = new (window as any).Razorpay({
      key: p.keyId,
      amount: p.amount,
      currency: 'INR',
      name: 'ARCHIVE 854105',
      description: opts.description,
      order_id: p.orderId,
      prefill: { name: opts.name, contact: opts.phone, email: opts.email },
      theme: { color: '#111111' },
      handler: (r: RazorpayResult) => resolve(r),
      modal: { ondismiss: () => resolve(null) },
    })
    rz.on?.('payment.failed', () => resolve(null))
    rz.open()
  })
}
