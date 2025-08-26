// EMERGENCY FIX - Replace broken image fields
import React, { useState } from 'react';

function EmergencyImageFix({ customization, setCustomization, saveCustomization, theme }) {
  const [logoUrl, setLogoUrl] = useState(customization.logoUrl || '');
  const [backgroundUrl, setBackgroundUrl] = useState(customization.loginBackgroundUrl || '');

  const handleLogoSave = async () => {
    const newCustomization = { ...customization, logoUrl };
    setCustomization(newCustomization);
    await saveCustomization(newCustomization);
    alert('Logo guardado!');
  };

  const handleBackgroundSave = async () => {
    const newCustomization = { ...customization, loginBackgroundUrl: backgroundUrl };
    setCustomization(newCustomization);
    await saveCustomization(newCustomization);
    alert('Fondo guardado!');
  };

  return (
    <div className="space-y-4 p-4 border border-red-500">
      <h3 className="text-red-500 font-bold">EMERGENCY IMAGE FIX</h3>
      
      <div>
        <label className="block text-white text-sm mb-2">URL del Logo:</label>
        <input
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full p-2 mb-2 bg-gray-800 text-white border border-gray-600 rounded"
        />
        <button
          onClick={handleLogoSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          GUARDAR LOGO
        </button>
      </div>

      <div>
        <label className="block text-white text-sm mb-2">URL del Fondo:</label>
        <input
          type="text"
          value={backgroundUrl}
          onChange={(e) => setBackgroundUrl(e.target.value)}
          className="w-full p-2 mb-2 bg-gray-800 text-white border border-gray-600 rounded"
        />
        <button
          onClick={handleBackgroundSave}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          GUARDAR FONDO
        </button>
      </div>
    </div>
  );
}

export default EmergencyImageFix;