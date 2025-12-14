import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, FileSignature, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function SignatureManager() {
  const [loading, setLoading] = useState(true);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = "https://n8n.sensaibiz.au/webhook/settings/signature-manager";

  useEffect(() => {
    checkSignatureStatus();
  }, []);

  const checkSignatureStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sensaibiz_jwt');
      const response = await axios.post(API_URL, { action: 'check' }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.exists && response.data.webViewLink) {
        setSignatureUrl(response.data.webViewLink);
      } else {
        setSignatureUrl(null);
      }
    } catch (err) {
      console.error("Error fetching signature status:", err);
      setSignatureUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSignature = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sensaibiz_jwt');
      const response = await axios.post(API_URL, { action: 'create' }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.webViewLink) {
        setSignatureUrl(response.data.webViewLink);
        window.open(response.data.webViewLink, '_blank');
      }
    } catch (err) {
      console.error("Error creating signature:", err);
      setError("Failed to create signature file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
          <FileSignature size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Email Signature</h3>
          <p className="text-sm text-slate-500">Manage the signature appended to your AI-drafted emails.</p>
        </div>
      </div>

      <div className="pl-0 sm:pl-14">
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-md">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 size={18} className="animate-spin" /> Checking Google Drive...
          </div>
        ) : (
          <div>
            {signatureUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle2 size={18} /> Active
                </div>
                <div className="flex-1 text-sm text-green-800">
                  Your signature file is linked and ready.
                </div>
                <a 
                  href={signatureUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 text-sm bg-white text-slate-700 px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors font-medium shadow-sm"
                >
                  <ExternalLink size={14} /> Edit in Google Docs
                </a>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-3">
                  You don't have a signature set up yet. Create a Google Doc to add your logo and details.
                </p>
                <button 
                  onClick={handleCreateSignature}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <FileSignature size={16} /> Create Signature Doc
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
