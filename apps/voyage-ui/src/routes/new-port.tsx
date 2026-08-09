import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/new-port")({
  component: NewPortPage,
});

function NewPortPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F3F6] p-4">
      <div className="rounded border border-[#dcdfe6] bg-white px-8 py-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-[#102A3A]">Port</h1>
        <p className="mt-2 text-sm text-slate-500">Chức năng đang phát triển</p>
      </div>
    </div>
  );
}
