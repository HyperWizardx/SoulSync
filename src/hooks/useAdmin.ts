import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuthSession } from "@/components/AuthSessionProvider";
import {
  exportDataset,
  getAdminAccess,
  getPopulationMetrics,
  getStudentDetail,
  listStudents,
  type DatasetKey,
} from "@/lib/admin.functions";

export function useAdminAccess() {
  const { hasSession } = useAuthSession();
  const fn = useServerFn(getAdminAccess);
  return useQuery({
    queryKey: ["admin", "access"],
    queryFn: () => fn(),
    enabled: hasSession,
    staleTime: 60_000,
  });
}

export function useStudents(enabled: boolean) {
  const fn = useServerFn(listStudents);
  return useQuery({
    queryKey: ["admin", "students"],
    queryFn: () => fn(),
    enabled,
  });
}

export function useStudentDetail(userId: string, enabled: boolean) {
  const fn = useServerFn(getStudentDetail);
  return useQuery({
    queryKey: ["admin", "student", userId],
    queryFn: () => fn({ data: { userId } }),
    enabled,
  });
}

export function usePopulationMetrics(enabled: boolean) {
  const fn = useServerFn(getPopulationMetrics);
  return useQuery({
    queryKey: ["admin", "population"],
    queryFn: () => fn(),
    enabled,
  });
}

export function useExportDataset() {
  const fn = useServerFn(exportDataset);
  return async (dataset: DatasetKey) => {
    const result = await fn({ data: { dataset } });
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
    return result;
  };
}
