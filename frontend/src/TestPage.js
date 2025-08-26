// TEST PAGE - Direct API test
import React, { useEffect, useState } from 'react';

function TestPage() {
  const [data, setData] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    fetch('https://one-production-6db5.up.railway.app/api/settings')
      .then(r => r.json())
      .then(data => {
        console.log('Direct API test:', data);
        setData(data);
        setLogoUrl(data.logoUrl || '');
      })
      .catch(err => {
        console.error('API Error:', err);
        setData({ error: err.message });
      });
  };
  
  const saveLogo = async () => {
    setSaving(true);
    try {
      console.log('Saving logo:', logoUrl);
      const response = await fetch('https://one-production-6db5.up.railway.app/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logoUrl: logoUrl })
      });
      
      const result = await response.json();
      console.log('Save result:', result);
      alert('Logo guardado! Recarga para ver cambios.');
      loadData(); // Reload data
    } catch (error) {
      console.error('Save error:', error);
      alert('Error al guardar: ' + error.message);
    }
    setSaving(false);
  };
  
  return (
    <div style={{padding: '20px', backgroundColor: 'white', color: 'black'}}>
      <h1>API Test Page</h1>
      
      <div style={{margin: '20px 0', padding: '20px', border: '1px solid #ccc'}}>
        <h2>Test Guardar Logo:</h2>
        <input 
          type="text" 
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="URL del logo"
          style={{width: '100%', padding: '10px', marginBottom: '10px'}}
        />
        <button 
          onClick={saveLogo} 
          disabled={saving}
          style={{padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none'}}
        >
          {saving ? 'Guardando...' : 'Guardar Logo'}
        </button>
      </div>
      
      <pre>{JSON.stringify(data, null, 2)}</pre>
      
      {data?.logoUrl && (
        <div>
          <h2>Logo Actual:</h2>
          <img src={data.logoUrl} alt="Logo" style={{maxWidth: '200px'}} />
        </div>
      )}
    </div>
  );
}

export default TestPage;