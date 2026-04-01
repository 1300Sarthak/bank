export default function SpendingPage() {
  return (
    <>
      <div className="main-header fade-in">
        <h1 className="main-title">Spending</h1>
      </div>

      <div className="fade-in fade-in-delay-1">
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "80px 40px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--accent-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--accent)",
                marginBottom: 8,
              }}
            >
              Coming Soon
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px",
                fontFamily: "var(--font-display)",
              }}
            >
              Bank Account Spending
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                maxWidth: 420,
                margin: "0 auto",
              }}
            >
              Link your bank accounts via Teller.io to view balances,
              browse transactions, and track spending across all your
              institutions — all in one place.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 16,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[
              { label: "Account Balances", icon: "💳" },
              { label: "Transaction History", icon: "📊" },
              { label: "Spending Filters", icon: "🔍" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
