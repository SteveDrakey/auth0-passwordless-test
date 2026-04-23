interface BinOrderInlineFlowProps {
  onBack: () => void;
}

export default function BinOrderInlineFlow({ onBack }: BinOrderInlineFlowProps) {
  return (
    <>
      <div className="mb-6">
        <button
          className="text-link hover:underline text-sm mb-2 cursor-pointer flex items-center gap-1"
          onClick={onBack}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          All services
        </button>
        <h1 className="text-2xl font-bold text-navy">Order a new bin</h1>
        <p className="text-gray-500 text-sm mt-1">Full identity verification built into the app</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-council-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-council" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.18A1.5 1.5 0 014.5 17.07V6.93a1.5 1.5 0 011.536-1.28l5.384 3.18m0 0L17.5 12m-6.08 3.17L17.5 12m0 0l-6.08-3.17" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Inline MFA flow — coming soon</h2>
          <p className="text-sm text-gray-500 mb-6">This service will be available in Phase 4.</p>
          <button
            className="bg-council hover:bg-council-dark text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      </div>
    </>
  );
}
