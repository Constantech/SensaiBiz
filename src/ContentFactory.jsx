import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PenTool, Sliders, Sparkles, Save, CheckCircle2, Send, XCircle, Image as ImageIcon } from 'lucide-react';

export default function ContentFactory() {
  const [activeTab, setActiveTab] = useState('create');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  
  // State for the generated result
  const [generatedData, setGeneratedData] = useState(null);
  const [editableBody, setEditableBody] = useState('');

  // Default Configuration State
  const [config, setConfig] = useState({
    goal: '',
    audience: '',
    tone: 'Professional',
    length: 'Short',
    platform: 'LinkedIn'
  });

  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('sensaibiz_content_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('sensaibiz_content_config', JSON.stringify(config));
    setSaveStatus('Settings saved!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setGeneratedData(null);

    const token = localStorage.getItem('sensaibiz_jwt');

    try {
      // 1. Trigger Generation
      const response = await axios.post('https://n8n.sensaibiz.au/webhook/06d5ca59-556f-45ff-8f66-d9065be0889a', 
        { topic, settings: config },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // 2. Load data into state for editing
      const data = response.data; 
      setGeneratedData(data);
      
      // Handle different possible response keys safely
      const initialText = data.text || data.cleaned_post_body || data.output || "";
      setEditableBody(initialText);

    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate content.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedData?.approval_id) {
        console.warn("Missing Approval ID. Workflow might not resume correctly.");
    }
    
    setIsApproving(true);
    const token = localStorage.getItem('sensaibiz_jwt');

    try {
        // 3. Send Approval Signal
        await axios.post('https://n8n.sensaibiz.au/webhook/content-approval', 
            { 
                approval_id: generatedData?.approval_id,
                approved: true,
                final_text: editableBody 
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        alert("Content Approved! Posting to socials...");
        setGeneratedData(null);
        setTopic('');
        setEditableBody('');

    } catch (error) {
        console.error("Approval failed:", error);
        alert("Failed to send approval.");
    } finally {
        setIsApproving(false);
    }
  };

  const handleDiscard = () => {
    if(window.confirm("Are you sure you want to discard this content?")) {
        setGeneratedData(null);
        setEditableBody('');
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Content Factory</h2>
            <p className="text-slate-500">Generate, Edit, and Publish.</p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
            <button 
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <Sparkles size={16} /> Create
            </button>
            <button 
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <Sliders size={16} /> Configuration
            </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full gap-6">
            
            {/* INPUT SECTION */}
            {!generatedData && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all">
                    
                    {/* Platform Selector - Moved Here */}
                    <div className="mb-5 border-b border-slate-100 pb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Target Platform</label>
                        <select 
                            value={config.platform}
                            onChange={(e) => setConfig({...config, platform: e.target.value})}
                            className="w-full sm:w-1/3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 font-medium"
                        >
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Website">Website (Blog)</option>
                        </select>
                    </div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">What is this post about?</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                            placeholder="e.g. The future of AI in construction..."
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading || !topic}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
                        >
                            {isLoading ? <span className="animate-pulse">Generating...</span> : <><Sparkles size={18} /> Generate</>}
                        </button>
                    </div>

                    {/* Active Configuration Summary (Platform removed since it is above) */}
                    <div className="mt-4 flex gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 w-fit">
                        <span className="flex items-center gap-1"><strong className="text-slate-700">Tone:</strong> {config.tone}</span>
                        <span className="flex items-center gap-1"><strong className="text-slate-700">Audience:</strong> {config.audience || 'Not set'}</span>
                        <span className="flex items-center gap-1"><strong className="text-slate-700">Goal:</strong> {config.goal ? 'Set' : 'Not set'}</span>
                    </div>
                </div>
            )}

            {/* REVIEW & APPROVE SECTION */}
            {generatedData && (
                <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[600px]">
                    
                    {/* Left: Visual Asset */}
                    <div className="w-full md:w-1/3 space-y-4 flex flex-col">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <ImageIcon size={16} /> Generated Image
                            </h3>
                            <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center relative group">
                                {generatedData.image_url ? (
                                    <img src={generatedData.image_url} alt="Generated asset" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-slate-400 text-sm">No image generated</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Status Card */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
                            <p className="font-semibold mb-1">Waiting for Approval</p>
                            <p className="opacity-80">Review the text on the right. Edit if necessary, then click Approve to post.</p>
                        </div>
                    </div>

                    {/* Right: Text Editor */}
                    <div className="w-full md:w-2/3 flex flex-col gap-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <PenTool size={16} /> Edit Content ({config.platform})
                                </h3>
                                <div className="text-xs text-slate-400">Markdown supported</div>
                            </div>
                            
                            <textarea
                                value={editableBody}
                                onChange={(e) => setEditableBody(e.target.value)}
                                className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end">
                            <button 
                                onClick={handleDiscard}
                                disabled={isApproving}
                                className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors flex items-center gap-2"
                            >
                                <XCircle size={18} /> Discard
                            </button>
                            <button 
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-900/20 transition-all flex items-center gap-2"
                            >
                                {isApproving ? <span className="animate-pulse">Posting...</span> : <><Send size={18} /> Approve & Post</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* CONFIG TAB */}
      {activeTab === 'config' && (
        <div className="flex-1 max-w-2xl mx-auto w-full">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-4">Strategy Settings</h3>
                <div className="space-y-6">
                    {/* Platform Selector REMOVED from here */}
                    
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Main Goal</label><textarea value={config.goal} onChange={(e) => setConfig({...config, goal: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none h-24 resize-none" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Audience</label><input type="text" value={config.audience} onChange={(e) => setConfig({...config, audience: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Tone</label><input type="text" value={config.tone} onChange={(e) => setConfig({...config, tone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Length</label><input type="text" value={config.length} onChange={(e) => setConfig({...config, length: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" /></div>
                    </div>
                    <div className="pt-6 flex justify-between">
                         {saveStatus ? <span className="text-green-600 text-sm flex gap-2"><CheckCircle2 size={16}/> {saveStatus}</span> : <span></span>}
                        <button onClick={handleSaveConfig} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 flex gap-2"><Save size={16} /> Save Settings</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
