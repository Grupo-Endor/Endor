import type { DiagnosisIntake, DiagnosisReport } from "@/types/diagnosis";

type Row = {
  id: string;
  intake: DiagnosisIntake;
  report: DiagnosisReport;
  created_at: string;
};

const g = globalThis as unknown as {
  __endor_mock_store?: Map<string, Row>;
};

function store() {
  if (!g.__endor_mock_store) g.__endor_mock_store = new Map();
  return g.__endor_mock_store;
}

export function mockSave(
  id: string,
  intake: DiagnosisIntake,
  report: DiagnosisReport
) {
  store().set(id, {
    id,
    intake,
    report,
    created_at: new Date().toISOString(),
  });
}

export function mockGet(id: string) {
  return store().get(id) ?? null;
}
