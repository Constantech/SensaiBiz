import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, Briefcase, Plus, Search, MoreHorizontal, Loader2, CheckCircle2,
  Sparkles, Send, DollarSign, Calendar, X, FileText, Paperclip, Trash2, Edit2, Save
} from 'lucide-react';

export default function CrmModule() {
  const [viewState, setViewState] = useState('checking');
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);

  const [omniInput, setOmniInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // NEW: State for editing contact
  const [editingContact, setEditingContact] = useState(null);

  useEffect(() => {
    fetchCrmData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenuId && !event.target.closest('.action-menu-trigger')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const fetchCrmData = async () => {
    const token = localStorage.getItem('sensaibiz_jwt');
    try {
      const response = await axios.post('https://n8n.sensaibiz.au/webhook/crm',
        { action: 'fetch_data' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const sheetData = response.data.valueRanges;

      if (!sheetData) {
         setViewState('uninstalled');
         return;
      }

      // Map Contacts (Index 0: ContactID, 1: OrgID, 2: First, 3: Last, 4: Email, 5: Phone)
      const contactRows = sheetData[0].values || [];
      const formattedContacts = contactRows.map(row => ({
        id: row[0],
        firstName: row[2],
        lastName: row[3],
        name: `${row[2]} ${row[3]}`.trim(),
        orgId: row[1],
        email: row[4],
        phone: row[5],
        company: row[1],
        role: row[6],
        status: row[7]
      }));
      setContacts(formattedContacts);

      const dealRows = sheetData[1].values || [];
      const formattedDeals = dealRows.map(row => ({
        id: row[0], name: row[1], company: row[2], contactId: row[3], stage: row[4] || 'New', value: row[5], date: row[6]
      }));
      setDeals(formattedDeals);

      setViewState('installed');

    } catch (error) {
      console.warn("CRM fetch failed", error);
      setViewState('uninstalled');
    }
  };

  const handleInstall = async () => {
    setViewState('installing');
    const token = localStorage.getItem('sensaibiz_jwt');
    try {
      await axios.post('https://n8n.sensaibiz.au/webhook/install-module-crm', {}, { headers: { 'Authorization': `Bearer ${token}` } });
      fetchCrmData();
    } catch (error) {
      alert("Installation failed.");
      setViewState('uninstalled');
    }
  };

  const handleOmniCommand = async () => {
    if (!omniInput.trim()) return;
    setIsProcessing(true);
    const token = localStorage.getItem('sensaibiz_jwt');

    try {
        await axios.post('https://n8n.sensaibiz.au/webhook/crm',
            { action: 'ai_command', command: omniInput },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        setOmniInput('');
        fetchCrmData();
        alert("Action Executed!");

    } catch (error) {
        console.error(error);
        alert("Failed to execute command.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleContactAction = async (action, contactId) => {
    if (action === 'Delete') {
        if (!window.confirm("Are you sure you want to delete this contact?")) return;

        const previousContacts = [...contacts];
        setContacts(contacts.filter(c => c.id !== contactId));
        setActiveMenuId(null);

        const token = localStorage.getItem('sensaibiz_jwt');
        try {
            await axios.post('https://n8n.sensaibiz.au/webhook/crm',
                { action: 'delete_contact', id: contactId },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete contact.");
            setContacts(previousContacts);
        }
    } else if (action === 'Edit') {
        // Find the contact and open the modal
        const contactToEdit = contacts.find(c => c.id === contactId);
        if (contactToEdit) {
            setEditingContact(contactToEdit);
        }
        setActiveMenuId(null);
    }
  };

  // --- SUB-COMPONENT: Edit Contact Modal ---
  const EditContactModal = ({ contact, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        orgId: contact.orgId || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('sensaibiz_jwt');
        try {
            await axios.post('https://n8n.sensaibiz.au/webhook/crm',
                {
                    action: 'edit_contact',
                    id: contact.id,
                    data: formData
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            onSave(); // Refresh data
            onClose();
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update contact.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Edit Contact</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">First Name</label>
                            <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name</label>
                            <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                        <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Company (Organisation ID)</label>
                        <input value={formData.orgId} onChange={e => setFormData({...formData, orgId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // --- SUB-COMPONENT: Deal Modal ---
  const DealModal = ({ deal, onClose }) => {
    // (Same code as before - keeping it brief for the copy/paste block)
    // ... insert existing DealModal code here or assume previous implementation ...
    // Since I must provide the FULL file replacement, I will include the previous DealModal logic below.

    if (!deal) return null;
    const [detailTab, setDetailTab] = useState('overview');
    const [notes, setNotes] = useState([]);
    const [files, setFiles] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSavingNote, setIsSavingNote] = useState(false);

    useEffect(() => {
        const loadDetails = async () => {
            setIsLoadingDetails(true);
            const token = localStorage.getItem('sensaibiz_jwt');
            try {
                const response = await axios.post('https://n8n.sensaibiz.au/webhook/crm',
                    { action: 'fetch_details', parentId: deal.id },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                setNotes(response.data.notes || []);
                setFiles(response.data.files || []);
            } catch (error) { console.error(error); } finally { setIsLoadingDetails(false); }
        };
        loadDetails();
    }, [deal.id]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSavingNote(true);
        const token = localStorage.getItem('sensaibiz_jwt');
        try {
            await axios.post('https://n8n.sensaibiz.au/webhook/crm',
                { action: 'add_note', parentId: deal.id, content: newNote },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setNotes([...notes, { content: newNote, date: new Date().toISOString(), author: 'Me' }]);
            setNewNote('');
        } catch (error) { alert("Failed to save note."); } finally { setIsSavingNote(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{deal.name}</h2>
                        <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><DollarSign size={14}/> {deal.value}</span>
                            <span className="flex items-center gap-1"><Calendar size={14}/> {deal.date}</span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold uppercase">{deal.stage}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
                </div>
                <div className="flex px-6 border-b border-slate-100">
                    {['overview', 'notes', 'files'].map(tab => (
                        <button key={tab} onClick={() => setDetailTab(tab)} className={`pb-3 pt-4 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${detailTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab}</button>
                    ))}
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                    {detailTab === 'overview' && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-sm">
                            <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Deal ID</span><span className="font-mono text-xs">{deal.id}</span></div>
                            <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Stage</span><span className="font-medium text-slate-800">{deal.stage}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Value</span><span className="font-medium text-slate-800">{deal.value}</span></div>
                        </div>
                    )}
                    {detailTab === 'notes' && (
                        <div className="flex flex-col h-full gap-4">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Type a note..." className="w-full text-sm outline-none resize-none h-20 text-slate-700 bg-transparent" />
                                <div className="flex justify-end mt-2"><button onClick={handleAddNote} disabled={isSavingNote} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">{isSavingNote ? 'Saving...' : 'Add Note'}</button></div>
                            </div>
                            {isLoadingDetails ? <div className="text-center py-4 text-slate-400"><Loader2 className="animate-spin mx-auto"/> Loading notes...</div> : notes.length === 0 ? <div className="text-center py-4 text-slate-400 text-sm">No notes yet.</div> : (
                                <div className="space-y-3">
                                    {notes.map((note, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p><div className="mt-2 text-xs text-slate-400 flex justify-between"><span>{note.author}</span><span>{new Date(note.date).toLocaleDateString()}</span></div></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {detailTab === 'files' && <div className="flex flex-col h-full items-center justify-center text-slate-400 text-sm"><Paperclip size={32} className="mb-2 opacity-50"/><p>File uploading is coming in the next update.</p></div>}
                </div>
            </div>
        </div>
    );
  };

  // --- VIEW: UNINSTALLED ---
  if (viewState === 'uninstalled' || viewState === 'installing') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Users size={32} /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Enable CRM Module</h2>
          <button onClick={handleInstall} disabled={viewState === 'installing'} className="w-full py-3 px-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all mt-4">{viewState === 'installing' ? <><Loader2 size={20} className="animate-spin" /> Setting up...</> : <><CheckCircle2 size={20} /> Initialize CRM</>}</button>
        </div>
      </div>
    );
  }

  // --- VIEW: INSTALLED ---
  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {selectedDeal && <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />}

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContactModal
            contact={editingContact}
            onClose={() => setEditingContact(null)}
            onSave={() => {
                fetchCrmData(); // Refresh list after save
            }}
        />
      )}

      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600"><Sparkles size={20} /></div>
            <input type="text" value={omniInput} onChange={(e) => setOmniInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleOmniCommand()} disabled={isProcessing} placeholder="Tell the CRM what to do..." className="w-full pl-12 pr-14 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-800 shadow-inner" />
            <button onClick={handleOmniCommand} disabled={isProcessing} className="absolute right-2 top-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex gap-4 mb-6 border-b border-slate-200 pb-2">
            <button onClick={() => setActiveTab('contacts')} className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'contacts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Contacts</button>
            <button onClick={() => setActiveTab('deals')} className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'deals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Deals (Kanban)</button>
        </div>

        {activeTab === 'contacts' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Company</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Phone</th><th className="px-6 py-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {contacts.map((contact, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{contact.name}</td>
                                <td className="px-6 py-4 text-slate-600">{contact.company}</td>
                                <td className="px-6 py-4 text-slate-500">{contact.email}</td>
                                <td className="px-6 py-4 text-slate-500">{contact.phone}</td>
                                <td className="px-6 py-4 text-right relative">
                                    <button className="action-menu-trigger p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === idx ? null : idx); }}><MoreHorizontal size={18} /></button>
                                    {activeMenuId === idx && (
                                        <div className="absolute right-8 top-2 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-10 overflow-hidden text-left">
                                            <button onClick={() => handleContactAction('Edit', contact.id)} className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit2 size={12}/> Edit</button>
                                            <button onClick={() => handleContactAction('Delete', contact.id)} className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12}/> Delete</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Deals view logic remains same... */}
        {activeTab === 'deals' && (
            <div className="flex gap-6 overflow-x-auto pb-4 h-full">
                {['New', 'Qualified', 'Proposal', 'Won', 'Lost'].map(stage => {
                    const stageDeals = deals.filter(d => d.stage.toLowerCase() === stage.toLowerCase() || (stage === 'New' && !d.stage));
                    return (
                        <div key={stage} className="min-w-[280px] w-[280px] flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{stage}</h3>
                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{stageDeals.length}</span>
                            </div>
                            <div className="bg-slate-100/50 p-2 rounded-xl border border-slate-200/60 flex-1 space-y-3 overflow-y-auto">
                                {stageDeals.map((deal, idx) => (
                                    <div key={idx} onClick={() => setSelectedDeal(deal)} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all hover:border-blue-300 group">
                                        <div className="font-medium text-slate-800 text-sm mb-1">{deal.name}</div>
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md"><DollarSign size={12} /> {deal.value}</div>
                                            <div className="flex items-center gap-1 text-xs text-slate-400"><Calendar size={12} /> {deal.date}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}
