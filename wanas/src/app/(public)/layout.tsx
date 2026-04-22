import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen relative w-full">
      <Navbar />
      <main className="flex-1 w-full flex flex-col pt-16 md:pt-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
