export default function Auth0Badge() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-8 pt-6 border-t border-gray-100">
      <svg viewBox="0 0 40 44" className="h-5 w-5" fill="none">
        <path d="M33.12 9.86L25.56 0H14.44l7.56 9.86-2 6.16-6-4.38H0l2.88 8.88 5.24 3.62L3.04 28.5 8.72 44l5.92-4.14L20 44.5l5.36-4.64L31.28 44l-5.08-15.86 5.24-3.62L34.32 15.64H20.44l-2 6.16 7.56-9.86z" fill="#EB5424"/>
      </svg>
      <span>Built on <strong className="text-gray-500">Auth0</strong> Passwordless</span>
    </div>
  );
}
