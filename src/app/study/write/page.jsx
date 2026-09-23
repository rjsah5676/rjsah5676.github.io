import { Suspense } from "react";
import StudyWriteForm from "@/components/Study/StudyWriteForm";

export default function StudyWritePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>로딩중...</div>}>
      <StudyWriteForm />
    </Suspense>
  );
}
