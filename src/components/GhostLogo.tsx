import Image from "next/image";

// Custom Ghost Mark logo uploaded by the user
export function GhostLogo({
  size = 36,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative flex items-center justify-center rounded-xl"
        style={{
          width: size,
          height: size,
          background: "#040404",
          boxShadow: "0 0 20px rgba(4,186,99,0.45)",
        }}
      >
        <Image
          src="/custom-logo.png"
          alt="Ghost Mode Logo"
          width={size}
          height={size}
          className="rounded-xl object-cover"
        />
      </div>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-bone">
          Ghost<span className="text-signal">Mode</span>
        </span>
      )}
    </div>
  );
}
