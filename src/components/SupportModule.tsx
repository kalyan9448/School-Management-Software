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
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [schoolName, setSchoolName] = useState('');

  // Queue Segmentation State
  const [activeTab, setActiveTab] = useState<'student' | 'parent' | 'teacher' | 'platform'>('student');
  const [allTickets, setAllTickets] = useState<{ school: SupportTicket[]; platform: SupportTicket[] }>({
    school: [],
    platform: []
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for creating Platform Tickets
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
    
    // Load tickets independently for both queues
    try {
      const studentTickets = await ticketService.getSchoolTickets(user.school_id, 'school');
      const platformTickets = await ticketService.getSchoolTickets(user.school_id, 'platform');
      setAllTickets({
        school: studentTickets,
        platform: platformTickets
      });
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    }
    
    // Load school name independently
    try {
      const schools = await schoolService.getAll();
      const currentSchool = schools.find(s => s.id === user.school_id);
      if (currentSchool) {
        setSchoolName(currentSchool.name);
      } else {
        setSchoolName('Kidz Vision School of Education');
      }
    } catch (err) {
      console.error('Failed to load school name:', err);
      setSchoolName('Kidz Vision School of Education');
    }
    
    setLoading(false);
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
        ticketType: 'platform', // Tagged as platform support for Super Admin resolution
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
        userName: user?.name || 'School Admin',
        message: replyMessage,
        timestamp: new Date().toISOString(),
        // If it's a student ticket, the School Admin replies as the authority resolver.
        // If it's a platform ticket, the School Admin is the client requester.
        isAdminResponse: activeTab !== 'platform'
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

  const handleStatusChange = async (newStatus: 'Open' | 'In Progress' | 'Resolved' | 'Closed') => {
    if (!selectedTicket) return;
    try {
      await ticketService.update(selectedTicket.id, { status: newStatus });
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      loadData();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      alert('Failed to update status. Please verify permissions.');
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

  // Select tickets list based on active tab and search query
  const getRawTickets = () => {
    if (activeTab === 'platform') return allTickets.platform;
    if (activeTab === 'parent') return allTickets.school.filter(t => t.userRole === 'parent');
    if (activeTab === 'teacher') return allTickets.school.filter(t => t.userRole === 'teacher');
    // Default to student
    return allTickets.school.filter(t => t.userRole === 'student' || !t.userRole);
  };
  const rawTickets = getRawTickets();
  const filteredTickets = rawTickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900 font-display">Support & Help Desk</h1>
          <p className="text-gray-500 text-sm">
            {activeTab === 'platform'
              ? 'Submit technical inquiries or billing issues directly to platform developers.'
              : `View and resolve support requests submitted by ${activeTab}s of your school.`}
          </p>
        </div>
        {activeTab === 'platform' && !selectedTicket && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 animate-in fade-in duration-150"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-6 max-w-2xl shrink-0 border border-gray-200/50">
        <button
          onClick={() => {
            setActiveTab('student');
            setSelectedTicket(null);
            setSearchQuery('');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'student'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
          }`}
        >
          Student Support ({allTickets.school.filter(t => t.userRole === 'student' || !t.userRole).length})
        </button>
        <button
          onClick={() => {
            setActiveTab('parent');
            setSelectedTicket(null);
            setSearchQuery('');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'parent'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
          }`}
        >
          Parent Support ({allTickets.school.filter(t => t.userRole === 'parent').length})
        </button>
        <button
          onClick={() => {
            setActiveTab('teacher');
            setSelectedTicket(null);
            setSearchQuery('');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'teacher'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
          }`}
        >
          Teacher Support ({allTickets.school.filter(t => t.userRole === 'teacher').length})
        </button>
        <button
          onClick={() => {
            setActiveTab('platform');
            setSelectedTicket(null);
            setSearchQuery('');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'platform'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
          }`}
        >
          Platform Support ({allTickets.platform.length})
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex gap-6">
        {/* Ticket List column */}
        <div className={`${selectedTicket ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets by subject or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center bg-white py-12">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No tickets found in this queue.</p>
                {searchQuery && <p className="text-xs text-gray-400 mt-1">Try clearing your search query.</p>}
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 border-b border-gray-100 text-left hover:bg-purple-50/30 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-purple-50/50 border-r-4 border-r-purple-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{ticket.subject}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ticket.category}
                    </span>
                    <span className={`font-bold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-medium">
                      By: <span className="text-gray-800 font-bold">{ticket.userName}</span>
                    </span>
                    {ticket.assignedToName && (
                      <span className="text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                        Assigned: {ticket.assignedToName}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Ticket Conversation Panel */}
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
                  <h2 className="font-bold text-gray-900 text-sm lg:text-base">Ticket #{selectedTicket.id.slice(0, 8)}</h2>
                  <div className="text-[11px] text-gray-500 font-semibold flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                    <span className="uppercase text-purple-600">{selectedTicket.category}</span>
                    <span>•</span>
                    <span>{selectedTicket.priority} Priority</span>
                    {selectedTicket.assignedToName && (
                      <>
                        <span>•</span>
                        <span>Assigned to: {selectedTicket.assignedToName}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Creator: <span className="font-semibold text-gray-700">{selectedTicket.userName}</span> ({selectedTicket.userEmail})
                  </div>
                </div>
              </div>

              {/* Status control for School admin if student ticket, badge if platform ticket */}
              <div className="flex items-center gap-2">
                {selectedTicket.ticketType === 'school' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500 hidden sm:inline">Status:</span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value as any)}
                      className="text-xs font-bold border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-purple-600/20 shadow-sm transition-all"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                ) : (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                )}
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {/* Original Message */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md font-bold text-sm">
                  {selectedTicket.userName.charAt(0)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm inline-block max-w-[90%]">
                    <h4 className="font-bold text-gray-900 mb-1">{selectedTicket.subject}</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium pl-1">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Replies */}
              {(selectedTicket.responses || []).map((resp, idx) => {
                // If it is a student ticket:
                //   - isAdminResponse represents the School Admin response (resolver)
                // If it is a platform ticket:
                //   - isAdminResponse represents the Super Admin response (resolver)
                // We want the resolver responses on the left and the requester responses on the right (reversed)
                const isResolverRep = resp.isAdminResponse;
                
                return (
                  <div key={idx} className={`flex gap-4 ${isResolverRep ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md font-bold text-sm ${
                      isResolverRep ? 'bg-indigo-600' : 'bg-purple-600'
                    }`}>
                      {resp.userName.charAt(0)}
                    </div>
                    <div className={`flex-1 space-y-2 ${isResolverRep ? '' : 'text-right'}`}>
                      <div className={`p-4 rounded-2xl border shadow-sm inline-block max-w-[90%] ${
                        isResolverRep 
                          ? 'bg-indigo-50 border-indigo-100 rounded-tl-none text-left' 
                          : 'bg-white border-gray-100 rounded-tr-none text-left'
                      }`}>
                        {isResolverRep && (
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider mb-1 select-none">
                            {selectedTicket.ticketType === 'school' ? 'Admin Response' : 'Platform Support'}
                          </p>
                        )}
                        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{resp.message}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium px-1">{new Date(resp.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
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
            <p className="text-sm text-gray-400">
              {activeTab !== 'platform'
                ? "Click a help request from the list to reply or update its status."
                : "Our support team typically responds to platform issues within 24 hours."}
            </p>
          </div>
        )}
      </div>

      {/* Create Platform Support Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 my-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Platform Support Ticket</h2>
                <p className="text-sm text-gray-500">Report system issues or billing errors to platform developers.</p>
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
