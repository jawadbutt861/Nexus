import { MeetingSlot } from '../types';

export const meetingSlots: MeetingSlot[] = [
  {
    id: 'ms1',
    hostId: 'e1',
    guestId: 'i1',
    title: 'TechWave AI Pitch',
    date: '2026-03-30',
    startTime: '14:00',
    endTime: '15:00',
    status: 'confirmed',
    notes: 'Discuss AI platform and traction metrics',
  },
  {
    id: 'ms2',
    hostId: 'e1',
    title: 'Available Slot',
    date: '2026-04-01',
    startTime: '10:00',
    endTime: '11:00',
    status: 'available',
  },
  {
    id: 'ms3',
    hostId: 'i1',
    guestId: 'e3',
    title: 'HealthPulse Review',
    date: '2026-04-02',
    startTime: '15:00',
    endTime: '16:00',
    status: 'requested',
    notes: 'Initial review of mental health platform',
  },
];

export const getMeetingsForUser = (userId: string): MeetingSlot[] =>
  meetingSlots.filter(s => s.hostId === userId || s.guestId === userId);

export const addMeetingSlot = (slot: Omit<MeetingSlot, 'id'>): MeetingSlot => {
  const newSlot: MeetingSlot = { ...slot, id: `ms${meetingSlots.length + 1}` };
  meetingSlots.push(newSlot);
  return newSlot;
};

export const updateMeetingStatus = (
  id: string,
  status: MeetingSlot['status']
): MeetingSlot | null => {
  const idx = meetingSlots.findIndex(s => s.id === id);
  if (idx === -1) return null;
  meetingSlots[idx] = { ...meetingSlots[idx], status };
  return meetingSlots[idx];
};
