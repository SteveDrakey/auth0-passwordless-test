export interface StepDef {
  key: string;
  label: string;
  num: number;
}

interface StepIndicatorProps {
  current: string;
  steps: StepDef[];
}

export default function StepIndicator({ current, steps }: StepIndicatorProps) {
  const idx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex-1 text-center">
          <div className={`flex items-center justify-center gap-1.5 pb-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
            i <= idx ? "border-council text-council" : "border-gray-200 text-gray-400"
          } ${i === idx ? "font-semibold" : ""}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              i < idx ? "bg-council text-white" : i === idx ? "bg-council-100 text-council-700" : "bg-gray-100 text-gray-400"
            }`}>
              {i < idx ? "\u2713" : s.num}
            </span>
            <span>{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
