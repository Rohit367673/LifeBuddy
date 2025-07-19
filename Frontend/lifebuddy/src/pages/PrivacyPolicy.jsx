import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-md mt-8">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-2 text-gray-700">Last updated: July 2025</p>
      <p className="mb-4">LifeBuddy ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li><strong>Personal Information:</strong> Name, email address, phone number, Telegram username, and other contact details you provide.</li>
        <li><strong>Usage Data:</strong> Information about how you use our website and services (e.g., schedule preferences, completed tasks).</li>
        <li><strong>Device Data:</strong> IP address, browser type, device information, and cookies.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>Provide and improve our scheduling assistant services.</li>
        <li>Send you daily tasks and notifications via your chosen platform (WhatsApp, Telegram, or Email).</li>
        <li>Personalize your experience and recommendations.</li>
        <li>Communicate with you about your account, updates, and support.</li>
        <li>Comply with legal obligations.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. How We Share Your Information</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>We do <strong>not</strong> sell or rent your personal information.</li>
        <li>We may share your information with service providers (e.g., messaging APIs, email providers) to deliver notifications.</li>
        <li>We may share your information with legal authorities if required by law.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Security</h2>
      <p className="mb-4 text-gray-700">We use industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Your Choices</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>You can update your contact information and notification preferences at any time.</li>
        <li>You can opt out of notifications by changing your settings or contacting us.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Children’s Privacy</h2>
      <p className="mb-4 text-gray-700">Our services are not intended for children under 13. We do not knowingly collect data from children.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to This Policy</h2>
      <p className="mb-4 text-gray-700">We may update this Privacy Policy from time to time. Changes will be posted on this page.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Us</h2>
      <p className="mb-2 text-gray-700">If you have questions about this Privacy Policy, please contact us at:</p>
      <ul className="ml-6 text-gray-700">
        <li>Email: <a href="mailto:your@email.com" className="text-blue-600 underline">your@email.com</a></li>
        <li>Address: [Your Business Address]</li>
      </ul>
    </div>
  );
} 