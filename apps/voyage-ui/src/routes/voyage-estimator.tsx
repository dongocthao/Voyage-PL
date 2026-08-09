import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const VoyageEstimator = lazy(() => import("@/components/voyage-estimator/VoyageEstimator"));

export const Route = createFileRoute("/voyage-estimator")({
  head: () => ({
    meta: [
      { title: "Voyage Estimator | Bảng tính chuyến biển 5011" },
      {
        name: "description",
        content:
          "Màn hình Voyage Estimation dạng desktop: vessel particular, cargo, port rotation, bunker và kết quả lợi nhuận chuyến.",
      },
      { property: "og:title", content: "Voyage Estimator | Bảng tính chuyến biển 5011" },
      {
        property: "og:description",
        content:
          "Ước tính chuyến biển: tàu, hàng hóa, lịch trình cảng, chi phí nhiên liệu và lợi nhuận.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VoyageEstimatorPage,
});

function VoyageEstimatorPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Đang tải Voyage Estimator…</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Đang tải Voyage Estimator…</div>}>
        <VoyageEstimator />
      </Suspense>
    </ClientOnly>
  );
}
