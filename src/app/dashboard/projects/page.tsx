import ProjectList from "@/components/projects/ProjectList";

export const metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full p-4 sm:p-6 lg:p-8">
      <ProjectList />
    </div>
  );
}
