import Sidebar from "@/components/layout/Sidebar";
import { PortfolioProvider } from "@/context/PortfolioContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <PortfolioProvider>{children}</PortfolioProvider>
      </main>
    </div>
  );
}
