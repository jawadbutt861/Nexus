import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { getMeetingsForUser, addMeetingSlot, updateMeetingStatus, meetingSlots } from '../../data/meetings';
import { MeetingSlot } from '../../types';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const statusVariant: Record<MeetingSlot['status'], 'success' | 'warning' | 'primary' | 'error'> = {
  confirmed: 'success',
  available: 'primary',
  requested: 'warning',
  declined: 'error',
};

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ title: '', startTime: '09:00', endTime: '10:00', notes: '' });
  const [, forceUpdate] = useState(0);

  if (!user) return null;

  const meetings = getMeetingsForUser(user.id);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayMeetings = meetings.filter(m => m.date === selectedDateStr);

  const tileContent = ({ date }: { date: Date }) => {
    const ds = format(date, 'yyyy-MM-dd');
    const hasMeeting = meetingSlots.some(
      m => m.date === ds && (m.hostId === user.id || m.guestId === user.id)
    );
    return hasMeeting ? (
      <div className="flex justify-center mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
      </div>
    ) : null;
  };

  const handleAddSlot = () => {
    if (!newSlot.title) { toast.error('Please enter a title'); return; }
    addMeetingSlot({
      hostId: user.id,
      title: newSlot.title,
      date: selectedDateStr,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      status: 'available',
      notes: newSlot.notes,
    });
    toast.success('Availability slot added');
    setShowAddModal(false);
    setNewSlot({ title: '', startTime: '09:00', endTime: '10:00', notes: '' });
    forceUpdate(n => n + 1);
  };

  const handleStatusChange = (id: string, status: MeetingSlot['status']) => {
    updateMeetingStatus(id, status);
    toast.success(`Meeting ${status}`);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Calendar</h1>
          <p className="text-gray-600">Manage your availability and meetings</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
          Add Availability
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <style>{`
                .react-calendar { width: 100%; border: none; font-family: inherit; }
                .react-calendar__tile--active { background: #2563EB !important; color: white !important; border-radius: 6px; }
                .react-calendar__tile:hover { background: #EFF6FF; border-radius: 6px; }
                .react-calendar__navigation button:hover { background: #EFF6FF; border-radius: 6px; }
              `}</style>
              <Calendar
                onChange={(val) => setSelectedDate(val as Date)}
                value={selectedDate}
                tileContent={tileContent}
              />
            </CardBody>
          </Card>
        </div>

        {/* Day meetings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {dayMeetings.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No meetings on this day</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddModal(true)}>
                    Add slot
                  </Button>
                </div>
              ) : (
                dayMeetings.map(meeting => (
                  <div key={meeting.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-gray-900 text-sm">{meeting.title}</p>
                      <Badge variant={statusVariant[meeting.status]} size="sm">{meeting.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {meeting.startTime} – {meeting.endTime}
                    </p>
                    {meeting.notes && <p className="text-xs text-gray-500 mt-1">{meeting.notes}</p>}
                    {meeting.status === 'requested' && meeting.hostId === user.id && (
                      <div className="flex gap-2 mt-2">
                        <Button size="xs" variant="success" leftIcon={<CheckCircle size={12} />}
                          onClick={() => handleStatusChange(meeting.id, 'confirmed')}>
                          Accept
                        </Button>
                        <Button size="xs" variant="error" leftIcon={<XCircle size={12} />}
                          onClick={() => handleStatusChange(meeting.id, 'declined')}>
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {/* Upcoming confirmed */}
          <Card>
            <CardHeader>
              <h2 className="text-base font-medium text-gray-900">Upcoming Confirmed</h2>
            </CardHeader>
            <CardBody className="space-y-2">
              {meetings.filter(m => m.status === 'confirmed').slice(0, 3).map(m => (
                <div key={m.id} className="flex items-center gap-3 text-sm">
                  <CheckCircle size={16} className="text-success-500 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{m.title}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(m.date), 'MMM d')} · {m.startTime}</p>
                  </div>
                </div>
              ))}
              {meetings.filter(m => m.status === 'confirmed').length === 0 && (
                <p className="text-sm text-gray-500">No confirmed meetings yet</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Add slot modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Availability Slot</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Investor Meeting"
                  value={newSlot.title}
                  onChange={e => setNewSlot(s => ({ ...s, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newSlot.startTime}
                    onChange={e => setNewSlot(s => ({ ...s, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newSlot.endTime}
                    onChange={e => setNewSlot(s => ({ ...s, endTime: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2} placeholder="Any notes..."
                  value={newSlot.notes}
                  onChange={e => setNewSlot(s => ({ ...s, notes: e.target.value }))} />
              </div>
              <p className="text-xs text-gray-500">Date: {format(selectedDate, 'MMMM d, yyyy')}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button fullWidth onClick={handleAddSlot}>Add Slot</Button>
              <Button fullWidth variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
