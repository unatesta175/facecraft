import AdminLayout from '@/components/admin-layout';

export default function PrivacyPolicyPage() {
  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[--color-text-primary]">Privacy Policy</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">Last updated: June 2026</p>
        </div>

        <div className="bg-white border border-[--color-border] rounded-xl p-8 space-y-6 text-sm text-[--color-text-primary] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[--color-text-primary]">1. Introduction</h2>
            <p className="text-[--color-text-secondary]">FaceCraft Studio ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our photo capture and printing services.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[--color-text-primary]">2. Information We Collect</h2>
            <p className="text-[--color-text-secondary]">We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-1 text-[--color-text-secondary] ml-2">
              <li>Photographic images captured at our kiosks</li>
              <li>Email addresses for digital delivery</li>
              <li>Payment information processed through secure gateways</li>
              <li>Order details and preferences</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[--color-text-primary]">3. How We Use Your Information</h2>
            <p className="text-[--color-text-secondary]">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 text-[--color-text-secondary] ml-2">
              <li>Process and fulfill your photo orders</li>
              <li>Deliver digital copies via email</li>
              <li>Improve our services and kiosk experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[--color-text-primary]">4. Image Storage and Retention</h2>
            <p className="text-[--color-text-secondary]">Your photos are stored securely on our servers for a period of 7 days after capture, after which they are automatically deleted unless a longer retention period has been explicitly agreed upon. Physical prints are not retained after your order is completed.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[--color-text-primary]">5. Data Security</h2>
            <p className="text-[--color-text-secondary]">We implement industry-standard security measures including encryption, access controls, and regular security audits to protect your personal information from unauthorized access, disclosure, or loss.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[--color-text-primary]">6. Third-Party Services</h2>
            <p className="text-[--color-text-secondary]">We use AWS (Amazon Web Services) for secure cloud storage and AI-powered face recognition technology. These services are bound by their own privacy policies and our data processing agreements.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[--color-text-primary]">7. Your Rights</h2>
            <p className="text-[--color-text-secondary]">You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact our support team.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[--color-text-primary]">8. Contact Us</h2>
            <p className="text-[--color-text-secondary]">If you have questions about this Privacy Policy, please contact us at: <span className="text-[--color-gold]">privacy@facecraftstudio.com</span></p>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
