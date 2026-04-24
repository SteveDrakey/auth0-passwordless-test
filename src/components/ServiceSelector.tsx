export type Service = "streetlight" | "streetlight-magic" | "bin-inline" | "bin-universal";

interface ServiceSelectorProps {
  onSelect: (service: Service) => void;
}

interface ServiceCard {
  service: Service;
  title: string;
  description: string;
  badge: string;
  assurance: "Low" | "Med";
  icon: React.ReactNode;
}

const streetlightIcon = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
  </svg>
);

const binIcon = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const cards: ServiceCard[] = [
  {
    service: "streetlight",
    title: "Report a streetlight",
    description: "Submit a simple form and verify via a code sent to your email",
    badge: "Email OTP",
    assurance: "Low",
    icon: streetlightIcon,
  },
  {
    service: "streetlight-magic",
    title: "Report a streetlight",
    description: "Submit your report, then click a link in your email to verify",
    badge: "Magic Link",
    assurance: "Low",
    icon: streetlightIcon,
  },
  {
    service: "bin-inline",
    title: "Order a new bin",
    description: "Sign in with your persistent account using password and MFA",
    badge: "Inline MFA",
    assurance: "Med",
    icon: binIcon,
  },
  {
    service: "bin-universal",
    title: "Order a new bin",
    description: "Sign in via a hosted Auth0 page with password and MFA",
    badge: "Universal Login",
    assurance: "Med",
    icon: binIcon,
  },
];

const assuranceStyles = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Med: "bg-amber-50 text-amber-700 border-amber-200",
};

const assuranceBorder = {
  Low: "hover:border-green-400",
  Med: "hover:border-amber-400",
};

export default function ServiceSelector({ onSelect }: ServiceSelectorProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-navy">Council services</h1>
        <p className="text-gray-500 text-sm mt-1">Choose a service to get started</p>
      </div>

      <div className="flex gap-10 items-start justify-center">
      {/* Left panel — explainer */}
      <div className="w-80 flex-shrink-0 sticky top-8">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-5 text-sm text-gray-600 leading-relaxed shadow-sm">
          <p>
            Identity powered by <strong>Auth0</strong>. Each card is the same service
            with a different authentication method, demonstrating how a single platform
            supports multiple assurance levels.
          </p>

          <hr className="my-4 border-gray-100" />

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${assuranceStyles.Low}`}>Low</span>
                <span className="text-gray-700 text-xs font-semibold">Engage, Submit and Track</span>
              </div>
              <p className="text-gray-500 text-xs mt-1.5 ml-0.5 italic">We're proving we can reach the customer — not who they are</p>
              <p className="text-gray-400 text-xs mt-1 ml-0.5">Email, Magic Link, SMS OTP</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${assuranceStyles.Med}`}>Med</span>
                <span className="text-gray-700 text-xs font-semibold">Self-Serve</span>
              </div>
              <p className="text-gray-500 text-xs mt-1.5 ml-0.5 italic">A consistent digital identity, but not yet a legally verified one</p>
              <p className="text-gray-400 text-xs mt-1 ml-0.5">Persistent CIAM identity, MFA, profile, sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — service cards */}
      <div className="flex-1 max-w-xl space-y-4">
        {cards.map((card) => (
          <button
            key={card.service}
            onClick={() => onSelect(card.service)}
            className={`w-full bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 text-left ${assuranceBorder[card.assurance]} hover:shadow-md transition-all cursor-pointer group`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-council-50 flex items-center justify-center text-council flex-shrink-0 group-hover:bg-council-100 transition-colors">
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-council-50 text-council whitespace-nowrap">
                    {card.badge}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${assuranceStyles[card.assurance]}`}>
                  {card.assurance} Assurance
                </span>
                <p className="text-sm text-gray-500 mt-1">{card.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1 group-hover:text-council transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
