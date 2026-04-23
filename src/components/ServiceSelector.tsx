export type Service = "streetlight" | "streetlight-magic" | "bin-inline" | "bin-universal";

interface ServiceSelectorProps {
  onSelect: (service: Service) => void;
}

interface ServiceCard {
  service: Service;
  title: string;
  description: string;
  badge: string;
  assurance: "Low" | "Medium";
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
    description: "Quick report, just verify your email with a one-time code",
    badge: "Email OTP",
    assurance: "Low",
    icon: streetlightIcon,
  },
  {
    service: "streetlight-magic",
    title: "Report a streetlight",
    description: "Verify your email by clicking a link we send you",
    badge: "Magic Link",
    assurance: "Low",
    icon: streetlightIcon,
  },
  {
    service: "bin-inline",
    title: "Order a new bin",
    description: "Full identity verification built into the app",
    badge: "Password + Authenticator",
    assurance: "Medium",
    icon: binIcon,
  },
  {
    service: "bin-universal",
    title: "Order a new bin (Auth0)",
    description: "Identity verification via Auth0 hosted page",
    badge: "Universal Login",
    assurance: "Medium",
    icon: binIcon,
  },
];

const assuranceStyles = {
  Low: "bg-blue-50 text-blue-700",
  Medium: "bg-amber-50 text-amber-700",
};

export default function ServiceSelector({ onSelect }: ServiceSelectorProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Council services</h1>
        <p className="text-gray-500 text-sm mt-1">Choose a service to get started</p>
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
          Identity powered by <strong>Auth0</strong> — each service demonstrates a different authentication pattern,
          from simple email verification to full multi-factor authentication.
        </div>
      </div>

      <div className="space-y-4">
        {cards.map((card) => (
          <button
            key={card.service}
            onClick={() => onSelect(card.service)}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 text-left hover:border-council hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-council-50 flex items-center justify-center text-council flex-shrink-0 group-hover:bg-council-100 transition-colors">
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-council-50 text-council">
                    {card.badge}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assuranceStyles[card.assurance]}`}>
                    {card.assurance} Assurance
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{card.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1 group-hover:text-council transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
