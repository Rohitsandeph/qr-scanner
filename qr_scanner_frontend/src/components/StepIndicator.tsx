import { ScanPhase } from '../types';

interface StepIndicatorProps {
  phase: ScanPhase;
}

const steps = [
  { key: 'SCAN_FIRST', label: 'Scan QR #1' },
  { key: 'SCAN_SECOND', label: 'Scan QR #2' },
  { key: 'RESULT', label: 'Result' },
];

export function StepIndicator({ phase }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === phase);

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
