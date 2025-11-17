import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col md:flex-row justify-center md:space-x-8 mb-4">
          <a href="#" className="hover:text-white transition-colors duration-200 my-1 md:my-0">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors duration-200 my-1 md:my-0">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors duration-200 my-1 md:my-0">Returns</a>
          <a href="#" className="hover:text-white transition-colors duration-200 my-1 md:my-0">Support</a>
        </div>
        <p className="text-sm">&copy; {new Date().getFullYear()} AutoParts Nexus Pro. All rights reserved.</p>
        <p className="text-xs mt-2">Powered by Gemini AI</p>
      </div>
    </footer>
  );
};

export default Footer;