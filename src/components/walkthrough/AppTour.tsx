import React, { useState } from 'react';
import { Joyride, CallBackProps, STATUS, Step } from 'react-joyride';
import { HelpCircle } from 'lucide-react';

const steps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-2">Welcome to Business Nexus!</h3>
        <p className="text-sm text-gray-600">Let's take a quick tour of the platform's key features.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar"]',
    content: (
      <div>
        <h3 className="font-bold mb-1">Navigation Sidebar</h3>
        <p className="text-sm text-gray-600">Access all features from here — dashboard, messages, calendar, documents, payments, and more.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="dashboard-stats"]',
    content: (
      <div>
        <h3 className="font-bold mb-1">Dashboard Overview</h3>
        <p className="text-sm text-gray-600">See your key metrics at a glance — pending requests, connections, meetings, and profile views.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="calendar-link"]',
    content: (
      <div>
        <h3 className="font-bold mb-1">Meeting Calendar</h3>
        <p className="text-sm text-gray-600">Schedule availability slots, send meeting requests, and manage confirmed meetings.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="video-link"]',
    content: (
      <div>
        <h3 className="font-bold mb-1">Video Calls</h3>
        <p className="text-sm text-gray-600">Start video or audio calls with your connections. Toggle camera, mic, and screen sharing.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="documents-link"]',
    content: (
      <div>
        <h3 className="font-bold mb-1">Document Chamber</h3>
        <p className="text-sm text-gray-600">Upload, preview, and e-sign deal documents. Track status from Draft → In Review → Signed.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="payments-link"]',
    content: (
      <div>
        <h3 className="font-bold mb-1">Payments</h3>
        <p className="text-sm text-gray-600">Manage your wallet — deposit, withdraw, transfer funds, and fund deals directly.</p>
      </div>
    ),
    placement: 'right',
  },
];

export const AppTour: React.FC = () => {
  const [run, setRun] = useState(false);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
    }
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        callback={handleCallback}
        styles={{
          options: {
            primaryColor: '#2563EB',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: '12px',
            padding: '16px',
          },
          buttonNext: {
            backgroundColor: '#2563EB',
            borderRadius: '6px',
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#6B7280',
          },
          buttonSkip: {
            color: '#9CA3AF',
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip tour',
        }}
      />

      <button
        onClick={() => setRun(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        title="Start guided tour"
      >
        <HelpCircle size={22} />
      </button>
    </>
  );
};
