import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";
import { withTimeout } from "@/presentation/components/common/QueryStatus";
import {
  exportDataset,
  getAdminAccess,
  getPopulationMetrics,
  getStudentDetail,
  listStudents,
  getPsychologistDashboard,
  addFollowUp,
  addCalendarPeriod,
  removeCalendarPeriod,
  type DatasetKey,
  getModelsReport,
  getModelLab,
  trainCompass,
  activateCompass,
} from "@/service/server-functions/admin.functions";

export function useAdminAccess() {
  const { hasSession } = useAuthSession();
  const fn = useServerFn(getAdminAccess);
  return useQuery({
    queryKey: ["admin", "access"],
    queryFn: () => withTimeout(fn()),
    retry: 1,
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
    queryFn: () => withTimeout(fn()),
    enabled,
    retry: 1,
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

export function usePsychologistDashboard(enabled: boolean) {
  const fn = useServerFn(getPsychologistDashboard);
  return useQuery({ queryKey: ["admin", "psych-dashboard"], queryFn: () => fn(), enabled });
}

/** Registrar seguimiento: refresca la ficha y la cola de atención. */
export function useAddFollowUp(studentId: string) {
  const fn = useServerFn(addFollowUp);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => fn({ data: { studentId, note } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
}

export function useCalendarActions() {
  const add = useServerFn(addCalendarPeriod);
  const remove = useServerFn(removeCalendarPeriod);
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["admin"] });
  return {
    add: useMutation({ mutationFn: (p: { label: string; start: string; end: string }) => add({ data: p }), onSuccess: done }),
    remove: useMutation({ mutationFn: (id: string) => remove({ data: { id } }), onSuccess: done }),
  };
}

/** Modelos de IA y desempeño del recomendador (panel de investigación). */
export function useModelsReport(enabled: boolean) {
  const fn = useServerFn(getModelsReport);
  return useQuery({ queryKey: ["admin", "models"], queryFn: () => withTimeout(fn()), enabled, retry: 1 });
}

/** Laboratorio de la brújula, pronóstico y perfiles (investigación). */
export function useModelLab(enabled: boolean) {
  const fn = useServerFn(getModelLab);
  return useQuery({ queryKey: ["admin", "lab"], queryFn: () => withTimeout(fn()), enabled, retry: 1, staleTime: 60_000 });
}

/** Entrenar y activar brújulas: refresca el laboratorio, las métricas y los modelos. */
export function useCompassActions() {
  const trainFn = useServerFn(trainCompass);
  const activateFn = useServerFn(activateCompass);
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["admin"] });
  return {
    train: useMutation({ mutationFn: () => trainFn(), onSuccess: done }),
    activate: useMutation({ mutationFn: (version: string) => activateFn({ data: { version } }), onSuccess: done }),
  };
}
