import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ticketService, schoolService, type SupportTicket, type TicketResponse } from '../utils/centralDataService';

export function SupportModule() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [schoolName, setSchoolName] = useState('');

  // Form State
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Technical' | 'Billing' | 'Feature Request' | 'Other'>('Technical');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.school_id) return;
    setLoading(true);
    try {
      const [fetchedTickets, schools] = await Promise.all([
        ticketService.getSchoolTickets(user.school_id),
        schoolService.getAll()
      ]);
      setTickets(fetchedTickets);
      
      const currentSchool = schools.find(s => s.id === user.school_id);
      if (currentSchool) setSchoolName(currentSchool.name);
    } catch (err) {
      console.error('Failed to load support data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.school_id) return;

    setIsSubmitting(true);
    try {
      await ticketService.create({
        school_id: user.school_id,
        schoolName: schoolName || 'Unknown School',
        userId: user.id || '',
        userName: user.name || '',
        userEmail: user.email || '',
        subject: newSubject,
        message: newMessage,
        priority: newPriority,
        category: newCategory,
        status: 'Open',
        responses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowCreateModal(false);
      setNewSubject('');
      setNewMessage('');
      loadData();
    } catch (err) {
      console.error('Failed to create ticket:', err);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const response: TicketResponse = {
        userId: user?.id || '',
        userName: user?.name || '',
        message: replyMessage,
        timestamp: new Date().toISOString(),
        isAdminResponse: false
      };

      await ticketService.addResponse(selectedTicket.id, response);
      setReplyMessage('');
      
      // Refresh selected ticket
      const updated = await ticketService.getById(selectedTicket.id);
      if (updated) setSelectedTicket(updated);
      loadData();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support & Help Desk</h1>
          <p className="text-gray-500">Need help? Report issues or request features directly to platform support.</p>
        </div>
        {!selectedTicket && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex gap-6">
        {/* Ticket List or Mobile Navigation */}
        <div className={`${selectedTicket ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
          <div className="p-4 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-8 text-center bg-white">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-gray-500 text-sm">No support tickets yet.</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 border-b border-gray-50 text-left hover:bg-purple-50/30 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-purple-50/50 border-r-4 border-r-purple-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{ticket.subject}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ticket.category}
                    </span>
                    <span className={`font-bold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Ticket Conversation */}
        {selectedTicket ? (
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Ticket Detail Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h2 className="font-bold text-gray-900">Ticket #{selectedTicket.id.slice(0, 8)}</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{selectedTicket.category} • {selectedTicket.priority} Priority</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {/* Original Message */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  {selectedTicket.userName.charAt(0)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm inline-block max-w-[90%]">
                    <h4 className="font-bold text-gray-900 mb-1">{selectedTicket.subject}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium pl-1">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Replies */}
              {selectedTicket.responses.map((resp, idx) => (
                <div key={idx} className={`flex gap-4 ${resp.isAdminResponse ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md ${resp.isAdminResponse ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                    {resp.userName.charAt(0)}
                  </div>
                  <div className={`flex-1 space-y-2 ${resp.isAdminResponse ? '' : 'text-right'}`}>
                    <div className={`p-4 rounded-2xl border shadow-sm inline-block max-w-[90%] ${
                      resp.isAdminResponse 
                        ? 'bg-indigo-50 border-indigo-100 rounded-tl-none text-left' 
                        : 'bg-white border-gray-100 rounded-tr-none text-left'
                    }`}>
                      {resp.isAdminResponse && <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter mb-1 select-none">Support Response</p>}
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{resp.message}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium px-1">{new Date(resp.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {selectedTicket.status !== 'Closed' ? (
              <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <div className="flex gap-4">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 active:bg-white focus:bg-white transition-all min-h-[50px] max-h-[150px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSubmitting || !replyMessage.trim()}
                    className="w-12 h-12 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 text-center text-gray-500 text-sm italic">
                This ticket is closed. Please create a new ticket for further assistance.
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
              <MessageSquare className="w-10 h-10 text-purple-200" />
            </div>
            <h2 className="text-xl font-bold text-gray-400">Select a ticket to view conversation</h2>
            <p className="text-sm text-gray-400">Our support team typically responds within 24 hours.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 my-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Support Ticket</h2>
                <p className="text-sm text-gray-500">How can we help you today?</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <Plus className="w-6 h-6 rotate-45 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Subject *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Unable to generate fee receipts"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:bg-white transition-all outline-none"
                  >
                    <option value="Technical">Technical Issue</option>
                    <option value="Billing">Billing & Subscription</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:bg-white transition-all outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Description *</label>
                <textarea
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Provide detailed information about the issue..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:bg-white transition-all outline-none min-h-[120px]"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Urgent</strong> status should only be used for critical system outages or data corruption. Regular issues will be addressed promptly under Standard priority.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
