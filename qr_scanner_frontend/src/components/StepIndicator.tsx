import type { ScanPhase } from '../types';

interface StepIndicatorProps {
  phase: ScanPhase;
}

const steps = [
  { key: 'first', label: 'Scan QR #1' },
  { key: 'second', label: 'Scan QR #2' },
  { key: 'result', label: 'Result' },
];

function phaseToStepIndex(phase: ScanPhase): number {
  switch (phase) {
    case 'IDLE_FIRST':
    case 'SCANNING_FIRST':
      return 0;
    case 'IDLE_SECOND':
    case 'SCANNING_SECOND':
      return 1;
    case 'READY_CHECK':
    case 'RESULT':
      return 2;
  }
}

export function StepIndicator({ phase }: StepIndicatorProps) {
  const currentIndex = phaseToStepIndex(phase);

  return (
    <div className="step-indicator">
      {steps.map((step, i) => (
        <div
          key={step.key}
          className={`step ${i <= currentIndex ? 'active' : ''} ${
            i === currentIndex ? 'current' : ''
          }`}
        >
          <div className="step-number">{i + 1}</div>
          <div className="step-label">{step.label}</div>
        </div>
      ))}
    </div>
  );
}
