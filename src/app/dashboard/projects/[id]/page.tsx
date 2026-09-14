import ProjectBoard from "@/components/projects/ProjectBoard";

export const metadata = {
  title: "Project board",
};

// Next 16 hands params over as a Promise.
export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full p-4 sm:p-6 lg:p-8">
      <ProjectBoard projectId={id} />
    </div>
  );
}
