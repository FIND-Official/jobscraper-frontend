import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobSearch } from "@/components/JobSearch";
import { JobList } from "@/components/JobList";
import { SavedJobsSidebar } from "@/components/SavedJobsSidebar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl">
          <JobSearch />
          
          <div className="mt-12">
            <JobList />
          </div>
        </div>
      </main>

      <SavedJobsSidebar />
      <Footer />
    </div>
  );
};

export default Index;
