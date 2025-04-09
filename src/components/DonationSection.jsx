import React from 'react';
import qrCodeImage from '/certificates/qr.png';
import childrenBg from '/certificates/don.png';

const DonationSection = () => {
  return (
    <div className="relative h-full rounded-3xl overflow-hidden min-h-[280px]">
      {/* Background with blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${childrenBg})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs"></div>
      </div>

      <div className="relative h-full flex flex-col p-4 justify-start">
        <h2 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
          Support a Cause
        </h2>
        
        <div className="flex flex-col items-center space-y-3 flex-grow">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-lg border border-white/20">
            <img 
              src={qrCodeImage} 
              alt="Donation QR Code" 
              className="w-48 h-48 mx-auto rounded-lg"
            />
          </div>
          <p className="text-gray-200 text-center text-xs leading-tight max-w-[200px] mb-2">
            Scan to support children's charities. Every contribution matters!
          </p>
          <button className="w-3/4 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white py-2 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:shadow-[#6366f1]/20">
            Donate Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationSection;