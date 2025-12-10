export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-gray-900 mb-4">Jiggly Pugffs</h3>
            <p className="text-gray-600">
              Your smart companion for symptom awareness and healthcare guidance.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-[#0EA5E9] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#0EA5E9] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#0EA5E9] transition-colors">
                  Medical Disclaimer
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-[#0EA5E9] transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#0EA5E9] transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#0EA5E9] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p>&copy; 2025 Jiggly Pugffs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
