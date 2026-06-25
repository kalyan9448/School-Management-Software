import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Send,
  ArrowLeft,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ticketService, 
  schoolService, 
  type SupportTicket, 
  type TicketResponse 
} from '../utils/firestoreService';

interface Props {
  userId: string;
  userRole: 'parent' | 'teacher';
}

export function SupportTicketsPanel({ userId, userRole }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [schoolName, setSchoolName] = useState('Our School');

  // New ticket form state
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Technical' | 'Billing' | 'Feature Request' | 'Other'>('Technical');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSchoolId = sessionStorage.getItem('active_school_id') || user?.school_id || '';

  useEffect(() => {
    loadTickets();
    loadSchoolInfo();
  }, [userId, activeSchoolId]);

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket, selectedTicket?.responses]);

  const loadTickets = async () => {
    if (!userId || !activeSchoolId) return;
    try {
      setLoading(true);
      const userTickets = await ticketService.getUserTickets(userId, activeSchoolId);
      setTickets(userTickets.filter(t => t.ticketType === 'school'));
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolInfo = async () => {
    if (!activeSchoolId) return;
    try {
      const info = await schoolService.getById(activeSchoolId);
      if (info?.name) {
        setSchoolName(info.name);
      }
    } catch (err) {
      console.error('Failed to load school name:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeSchoolId) return;

    if (!newSubject.trim() || !newMessage.trim()) {
      alert('Please fill in both subject and description.');
      return;
    }

    try {
      setIsSubmitting(true);
      const ticketPayload: Omit<SupportTicket, 'id'> = {
        school_id: activeSchoolId,
        schoolName: schoolName,
        userId: userId,
        userName: user.name || (userRole === 'parent' ? 'Parent' : 'Teacher'),
        userEmail: user.email || '',
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        message: newMessage.trim(),
        status: 'Open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
        ticketType: 'school',
        userRole: userRole
      };

      await ticketService.create(ticketPayload);
      alert('Support ticket created successfully!');
      
      // Reset form
      setNewSubject('');
      setNewMessage('');
      setNewCategory('Technical');
      setNewPriority('Medium');
      setShowCreateModal(false);
      
      // Reload tickets list
      await loadTickets();
    } catch (err) {
      console.error('Failed to create ticket:', err);
      alert('Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || !user) return;

    try {
      setIsSubmitting(true);
      const responsePayload: TicketResponse = {
        userId: userId,
        userName: user.name || (userRole === 'parent' ? 'Parent' : 'Teacher'),
        message: replyMessage.trim(),
        timestamp: new Date().toISOString(),
        isAdminResponse: false
      };

      await ticketService.addResponse(selectedTicket.id, responsePayload);
      
      // Update local ticket with new reply
      const updatedTicket = await ticketService.getById(selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      }
      setReplyMessage('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Failed to send response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-full">
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-600 border border-green-100 rounded-full">
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-gray-50 text-gray-500 border border-gray-100 rounded-full">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 font-bold';
      case 'High': return 'text-orange-600 font-semibold';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-purple-900 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Support Desk</h2>
          <p className="text-gray-500 font-medium">Submit requests and communicate with the School Administration.</p>
        </div>
        {!selectedTicket && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 border-none cursor-pointer"
            style={{ backgroundColor: '#581c87', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        )}
      </div>

      <div className="flex-1 min-h-[450px] flex flex-col lg:flex-row gap-6">
        {/* Ticket List View (Sidebar when a ticket is selected on desktop, full width otherwise) */}
        <div className={`${selectedTicket ? 'hidden lg:flex w-full lg:w-1/3' : 'flex w-full'} flex-col bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 bg-white placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] p-2 space-y-2">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-sm">No tickets found</p>
                <p className="text-xs text-gray-400 mt-1">Submit a ticket to get assistance.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-purple-50 border-purple-200'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 text-sm truncate max-w-[70%]">
                      {ticket.subject}
                    </h4>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {ticket.message}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                    <span>Category: {ticket.category}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Ticket Thread Details */}
        {selectedTicket && (
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-gray-200/50 rounded-lg text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    {selectedTicket.subject}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    Priority: <span className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</span> • Category: {selectedTicket.category}
                  </p>
                </div>
              </div>
              <div>
                {getStatusBadge(selectedTicket.status)}
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[400px]">
              {/* Original Message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {selectedTicket.userName.charAt(0)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none inline-block max-w-[85%]">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.message}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium pl-1">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Replies */}
              {selectedTicket.responses && selectedTicket.responses.map((resp, idx) => (
                <div key={idx} className={`flex gap-3 ${resp.isAdminResponse ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${resp.isAdminResponse ? 'bg-amber-500' : 'bg-purple-900'}`}>
                    {resp.userName.charAt(0)}
                  </div>
                  <div className={`flex-1 space-y-1 ${resp.isAdminResponse ? '' : 'text-right'}`}>
                    <div className={`p-4 rounded-2xl border text-left inline-block max-w-[85%] ${
                      resp.isAdminResponse 
                        ? 'bg-amber-50 border-amber-100 rounded-tl-none' 
                        : 'bg-purple-50 border-purple-100 rounded-tr-none'
                    }`}>
                      {resp.isAdminResponse && (
                        <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider mb-1 select-none">
                          School Administrator
                        </p>
                      )}
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {resp.message}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium px-1">
                      {new Date(resp.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Message Form */}
            {selectedTicket.status !== 'Closed' ? (
              <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/30">
                <input
                  type="text"
                  placeholder="Type your response here..."
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white placeholder:text-gray-400"
                />
                <button
                  onClick={handleSendReply}
                  disabled={isSubmitting || !replyMessage.trim()}
                  className="w-12 h-12 bg-purple-900 hover:bg-purple-800 text-white rounded-xl flex items-center justify-center transition-colors border-none cursor-pointer disabled:bg-gray-200 disabled:text-gray-400"
                  style={{ 
                    backgroundColor: isSubmitting || !replyMessage.trim() ? '#e5e7eb' : '#581c87', 
                    color: isSubmitting || !replyMessage.trim() ? '#9ca3af' : '#ffffff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: 'none', 
                    cursor: isSubmitting || !replyMessage.trim() ? 'not-allowed' : 'pointer',
                    borderRadius: '12px'
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 text-center text-gray-500 text-sm italic rounded-b-2xl border-t border-gray-100">
                This support ticket has been closed.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 transform scale-100 transition-all duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-black tracking-tight" style={{ fontWeight: 900 }}>Submit Support Ticket</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Subject / Issue
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your issue..."
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-purple-600 bg-white placeholder:text-gray-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-purple-600 bg-white text-sm"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-purple-600 bg-white text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Details / Message
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your request in detail..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-purple-600 bg-white placeholder:text-gray-400 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors bg-white cursor-pointer"
                  style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#4b5563', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: '#ffffff' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-sm transition-colors flex items-center gap-2 border-none cursor-pointer disabled:bg-purple-900/50"
                  style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: isSubmitting ? '#9d5be3' : '#581c87', color: '#ffffff', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', border: 'none' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
