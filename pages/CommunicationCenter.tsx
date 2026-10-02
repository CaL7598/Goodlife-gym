
import React, { useState, useMemo, useEffect } from 'react';
import { Member } from '../types';
import { Send, MessageSquare, History, Users, CheckSquare, Square, AlertCircle, Search, X } from 'lucide-react';
// AI Auto-Draft feature disabled
// import { generateCommunication } from '../geminiService';
import { sendMessageSMS, sendBulkMessageSMS, isSmsConfigured } from '../lib/smsService';
import { useToast } from '../contexts/ToastContext';
import { matchesClientSearch } from '../lib/memberSearch';

const MAX_RECIPIENT_RESULTS = 50;

const memberMatchesSearch = (member: Member, query: string) =>
  matchesClientSearch({ name: member.fullName, phone: member.phone, email: member.email }, query);

const CommunicationCenter: React.FC<{ members: Member[] }> = ({ members }) => {
  const { showSuccess, showError } = useToast();
  const smsConfigured = isSmsConfigured();
  const [sendMode, setSendMode] = useState<'single' | 'broadcast'>('single');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientResults, setShowRecipientResults] = useState(false);
  const [broadcastSearch, setBroadcastSearch] = useState('');
  const [msgType, setMsgType] = useState<'welcome' | 'reminder' | 'expiry' | 'general'>('reminder');
  const [message, setMessage] = useState('');
  // AI Auto-Draft feature disabled
  // const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Clear form fields on component mount (page refresh)
  useEffect(() => {
    setSelectedMemberId('');
    setSelectedMemberIds(new Set());
    setSelectAll(false);
    setMessage('');
  }, []);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const recipientResults = useMemo(() => {
    const matches = members.filter(m => memberMatchesSearch(m, recipientSearch));
    return recipientSearch.trim()
      ? matches
      : [...matches].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }, [members, recipientSearch]);

  const broadcastMembers = useMemo(
    () => members.filter(m => memberMatchesSearch(m, broadcastSearch)),
    [members, broadcastSearch]
  );

  const selectRecipient = (member: Member) => {
    setSelectedMemberId(member.id);
    setRecipientSearch('');
    setShowRecipientResults(false);
  };

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedMemberIds(new Set(members.map(m => m.id)));
    } else {
      setSelectedMemberIds(new Set());
    }
  };

  // Handle individual member selection
  const handleMemberToggle = (memberId: string) => {
    // When "select all" is on, unticking one member keeps everyone else selected
    const newSelection = selectAll ? new Set(members.map(m => m.id)) : new Set(selectedMemberIds);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    // Auto-select "select all" if all members are selected
    setSelectAll(newSelection.size === members.length);
    setSelectedMemberIds(newSelection);
  };

  // Add every member matching the current search to the selection
  const handleSelectShown = () => {
    const newSelection = new Set(selectedMemberIds);
    broadcastMembers.forEach(m => newSelection.add(m.id));
    setSelectAll(newSelection.size === members.length);
    setSelectedMemberIds(newSelection);
  };

  // AI Auto-Draft feature disabled
  // const handleAiDraft = async () => {
  //   if (sendMode === 'single' && !selectedMember) {
  //     alert("Please select a member first.");
  //     return;
  //   }
  //   setIsGenerating(true);
  //   
  //   if (sendMode === 'single' && selectedMember) {
  //     const draft = await generateCommunication(msgType, selectedMember.fullName, selectedMember.plan, selectedMember.expiryDate);
  //     setMessage(draft);
  //   } else {
  //     // For broadcast, generate a general message
  //     const draft = await generateCommunication('general', 'All Members', 'All Plans', '');
  //     setMessage(draft);
  //   }
  //   setIsGenerating(false);
  // };

  const handleSend = async () => {
    if (!message) {
      showError('Please enter a message to send.');
      return;
    }
    if (!smsConfigured) {
      showError('SMS not configured. Set VITE_API_URL to your backend URL (e.g. https://your-app.onrender.com) in your deployment environment.');
      return;
    }

    if (sendMode === 'single') {
      if (!selectedMember) return;
      if (!selectedMember.phone || !selectedMember.phone.trim()) {
        showError(`${selectedMember.fullName} has no phone number. SMS cannot be sent.`);
        return;
      }

      try {
        const result = await sendMessageSMS({
          memberName: selectedMember.fullName,
          memberPhone: selectedMember.phone,
          message: message,
          messageType: msgType
        });

        const newEntry = {
          id: Date.now(),
          to: selectedMember.fullName,
          type: msgType,
          date: new Date().toLocaleString(),
          preview: message.substring(0, 60) + '...',
          mode: 'single',
          smsSent: result.success
        };
        setHistory([newEntry, ...history]);
        setMessage('');

        if (result.success) {
          showSuccess(`SMS sent successfully to ${selectedMember.fullName}`);
        } else {
          const error = result.error;
          const errorMsg = error?.error || error?.message || 'Unknown error';
          showError(`Failed to send SMS to ${selectedMember.fullName}: ${errorMsg}`);
        }
      } catch (error: any) {
        console.error('SMS sending error:', error);
        showError(`Failed to send SMS to ${selectedMember.fullName}: ${error?.message || 'Unknown error'}`);
      }
    } else {
      // Broadcast mode
      if (selectedMemberIds.size === 0 && !selectAll) {
        showError("Please select at least one member or select all members.");
        return;
      }

      const recipients = selectAll ? members : members.filter(m => selectedMemberIds.has(m.id));
      const withPhone = recipients.filter(m => m.phone && m.phone.trim());

      if (withPhone.length === 0) {
        showError("No selected members have phone numbers. SMS cannot be sent.");
        return;
      }

      const smsData = withPhone.map(member => ({
        memberName: member.fullName,
        memberPhone: member.phone!,
        message: message,
        messageType: msgType as 'welcome' | 'reminder' | 'expiry' | 'general'
      }));

      const { success, failed } = await sendBulkMessageSMS(smsData);

      const newEntry = {
        id: Date.now(),
        to: selectAll ? `All Members (${withPhone.length})` : `${recipients.length} Members`,
        type: msgType,
        date: new Date().toLocaleString(),
        preview: message.substring(0, 60) + '...',
        mode: 'broadcast',
        recipients: withPhone.map(m => m.fullName).join(', '),
        smsSent: success,
        smsFailed: failed
      };
      setHistory([newEntry, ...history]);
      setMessage('');
      setSelectedMemberIds(new Set());
      setSelectAll(false);
      setBroadcastSearch('');

      if (failed === 0) {
        showSuccess(`SMS sent successfully to ${success} member(s)`);
      } else {
        showError(`SMS sent to ${success} member(s), ${failed} failed.`);
      }
    }
  };

  const selectedCount = useMemo(() => {
    return selectAll ? members.length : selectedMemberIds.size;
  }, [selectAll, selectedMemberIds, members.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Communication Center</h2>
          <p className="text-slate-500 text-sm">Send SMS messages to gym members.</p>
        </div>

        {!smsConfigured && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="font-bold text-amber-900 text-lg">SMS not configured – no messages will be sent</p>
              <p className="text-sm text-amber-800 mt-2">
                <strong>1.</strong> Add <code className="bg-amber-100 px-1 rounded">VITE_API_URL</code> in GitHub: Settings → Secrets → Actions → New secret. Value = your backend URL (e.g. <code className="bg-amber-100 px-1 rounded">https://your-app.onrender.com</code>).
              </p>
              <p className="text-sm text-amber-800 mt-1">
                <strong>2.</strong> Ensure the backend (Render) has <code className="bg-amber-100 px-1 rounded">ARKESEL_API_KEY</code> and <code className="bg-amber-100 px-1 rounded">ARKESEL_SENDER_ID</code> set.
              </p>
              <p className="text-sm text-amber-800 mt-1">
                <strong>3.</strong> Push any change to trigger a rebuild. See SMS_SETUP_STEP_BY_STEP.md for details.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          {/* Send Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Send Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSendMode('single');
                  setSelectedMemberIds(new Set());
                  setSelectAll(false);
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sendMode === 'single'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Single Member
              </button>
              <button
                onClick={() => {
                  setSendMode('broadcast');
                  setSelectedMemberId('');
                  setRecipientSearch('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  sendMode === 'broadcast'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Users size={16} />
                Broadcast
              </button>
            </div>
          </div>

          {sendMode === 'single' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Recipient</label>
                {selectedMember ? (
                  <div className="flex items-center justify-between gap-3 p-2.5 border border-rose-200 bg-rose-50 rounded-lg">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{selectedMember.fullName}</div>
                      <div className="text-xs text-slate-500">
                        {selectedMember.phone || 'No phone number'} · {selectedMember.plan}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMemberId('');
                        setShowRecipientResults(true);
                      }}
                      className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                      title="Change recipient"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      className="w-full pl-9 pr-9 p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="Search member by name, phone, or email..."
                      value={recipientSearch}
                      onChange={e => {
                        setRecipientSearch(e.target.value);
                        setShowRecipientResults(true);
                      }}
                      onFocus={() => setShowRecipientResults(true)}
                      onBlur={() => setShowRecipientResults(false)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && recipientSearch.trim() && recipientResults.length > 0) {
                          e.preventDefault();
                          selectRecipient(recipientResults[0]);
                        } else if (e.key === 'Escape') {
                          setShowRecipientResults(false);
                        }
                      }}
                    />
                    {recipientSearch && (
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setRecipientSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                    {showRecipientResults && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {recipientResults.length === 0 ? (
                          <p className="px-3 py-3 text-sm text-slate-500">
                            {members.length === 0 ? 'No members found.' : `No members match "${recipientSearch.trim()}".`}
                          </p>
                        ) : (
                          <>
                            {recipientResults.slice(0, MAX_RECIPIENT_RESULTS).map(m => (
                              <button
                                type="button"
                                key={m.id}
                                // Keep focus on the input so the click registers before the list closes
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => selectRecipient(m)}
                                className="w-full text-left px-3 py-2 hover:bg-rose-50 flex items-center justify-between gap-3 border-b border-slate-100 last:border-b-0"
                              >
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-slate-900 truncate">{m.fullName}</span>
                                  <span className="block text-xs text-slate-500">{m.phone || 'No phone number'}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">{m.plan}</span>
                              </button>
                            ))}
                            {recipientResults.length > MAX_RECIPIENT_RESULTS && (
                              <p className="px-3 py-2 text-xs text-slate-400 bg-slate-50">
                                Showing {MAX_RECIPIENT_RESULTS} of {recipientResults.length} — keep typing to narrow down
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Context</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  value={msgType}
                  onChange={e => setMsgType(e.target.value as any)}
                >
                  <option value="welcome">Welcome Onboard</option>
                  <option value="reminder">Subscription Reminder</option>
                  <option value="expiry">Notification of Expiry</option>
                  <option value="general">General Message</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Message Context</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  value={msgType}
                  onChange={e => setMsgType(e.target.value as any)}
                >
                  <option value="welcome">Welcome Onboard</option>
                  <option value="reminder">Subscription Reminder</option>
                  <option value="expiry">Notification of Expiry</option>
                  <option value="general">General Announcement</option>
                </select>
              </div>
              
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-80 overflow-y-auto">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    className="w-full pl-9 pr-9 p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="Search members by name, phone, or email..."
                    value={broadcastSearch}
                    onChange={e => setBroadcastSearch(e.target.value)}
                  />
                  {broadcastSearch && (
                    <button
                      type="button"
                      onClick={() => setBroadcastSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {broadcastSearch.trim() && (
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                    <span>{broadcastMembers.length} match{broadcastMembers.length === 1 ? '' : 'es'}</span>
                    {!selectAll && broadcastMembers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectShown}
                        className="font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Select all {broadcastMembers.length} shown
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                    <button
                      onClick={() => handleSelectAll(!selectAll)}
                      className="flex items-center gap-2 hover:text-rose-600 transition-colors"
                    >
                      {selectAll ? (
                        <CheckSquare size={18} className="text-rose-600" />
                      ) : (
                        <Square size={18} className="text-slate-400" />
                      )}
                      <span>Select All Members</span>
                    </button>
                  </label>
                  <span className="text-xs font-bold text-slate-500">
                    {selectedCount} of {members.length} selected
                  </span>
                </div>
                <div className="space-y-2">
                  {broadcastMembers.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No members match &quot;{broadcastSearch.trim()}&quot;
                    </p>
                  )}
                  {broadcastMembers.map(member => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectAll || selectedMemberIds.has(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-slate-700 truncate">{member.fullName}</span>
                        {member.phone && <span className="block text-xs text-slate-400">{member.phone}</span>}
                      </span>
                      <span className="text-xs text-slate-400">{member.plan}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <textarea 
              className="w-full h-64 p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
              placeholder="Start typing your message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            {members.length === 0 && (
              <p className="text-sm text-amber-600">No members in the directory. Add members first to send messages.</p>
            )}
            {smsConfigured && members.length > 0 && (() => {
              const whyDisabled = !message
                ? 'Enter a message to enable Send'
                : sendMode === 'single' && !selectedMemberId
                  ? 'Select a recipient to enable Send'
                  : sendMode === 'broadcast' && selectedCount === 0
                    ? 'Select at least one member or use Select All'
                    : null;
              return whyDisabled ? (
                <p className="text-xs text-slate-500">— {whyDisabled}</p>
              ) : null;
            })()}
            <button 
              onClick={handleSend}
              disabled={
                !smsConfigured ||
                !message || 
                (sendMode === 'single' && !selectedMemberId) ||
                (sendMode === 'broadcast' && selectedCount === 0)
              }
              title={
                !smsConfigured ? 'SMS not configured - set VITE_API_URL' :
                !message ? 'Enter a message first' :
                sendMode === 'single' && !selectedMemberId ? 'Select a member first' :
                sendMode === 'broadcast' && selectedCount === 0 ? 'Select at least one member or use Select All' :
                undefined
              }
              className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-rose-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {sendMode === 'broadcast' 
                ? `Send to ${selectedCount > 0 ? selectedCount : 'Members'}`
                : 'Send Message'
              }
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History size={20} className="text-slate-400" />
          Recent Comms
        </h3>
        <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100 min-h-[400px]">
          {history.length > 0 ? (
            history.map(entry => (
              <div key={entry.id} className="p-4 flex items-start justify-between group hover:bg-white transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{entry.to}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 rounded-full font-bold text-slate-500 uppercase">{entry.type}</span>
                    {entry.mode === 'broadcast' && (
                      <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold flex items-center gap-1">
                        <Users size={10} />
                        Broadcast
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{entry.preview}</p>
                  {entry.recipients && (
                    <p className="text-[10px] text-slate-400 mt-1">Recipients: {entry.recipients.substring(0, 100)}{entry.recipients.length > 100 ? '...' : ''}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium ml-2">{entry.date}</span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12">
              <MessageSquare size={48} className="opacity-10" />
              <p className="text-sm">No recent messages found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationCenter;
