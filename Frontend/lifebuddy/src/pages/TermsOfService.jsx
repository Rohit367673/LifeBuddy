import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-md mt-8">
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p className="mb-2 text-gray-700">Last updated: July 2025</p>
      <p className="mb-4">Welcome to LifeBuddy! By using our website and services, you agree to these Terms of Service.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Use of Service</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>You must be at least 13 years old to use our services.</li>
        <li>You agree to provide accurate information and keep your account secure.</li>
        <li>You are responsible for all activity on your account.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Notifications</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>By providing your contact information and opting in, you agree to receive daily tasks and notifications via your chosen platform (WhatsApp, Telegram, or Email).</li>
        <li>You can opt out at any time.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. User Content</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>You retain ownership of any content you submit (e.g., schedules, notes).</li>
        <li>You grant us a license to use your content to provide and improve our services.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Prohibited Conduct</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>Use our services for unlawful purposes.</li>
        <li>Attempt to disrupt or compromise our systems.</li>
        <li>Impersonate others or provide false information.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Termination</h2>
      <p className="mb-4 text-gray-700">We may suspend or terminate your access if you violate these terms.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Disclaimer</h2>
      <p className="mb-4 text-gray-700">Our services are provided “as is” without warranties of any kind. We are not liable for any damages resulting from your use of our services.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to Terms</h2>
      <p className="mb-4 text-gray-700">We may update these Terms of Service at any time. Changes will be posted on this page.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Us</h2>
      <p className="mb-2 text-gray-700">If you have questions about these Terms, please contact us at:</p>
      <ul className="ml-6 text-gray-700">
        <li>Email: <a href="mailto:your@email.com" className="text-blue-600 underline">your@email.com</a></li>
        <li>Address: [Your Business Address]</li>
      </ul>
    </div>
  );
} 