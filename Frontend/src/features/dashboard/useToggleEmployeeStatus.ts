import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AIEmployeeConfig, EmployeeStatus, EmployeeType } from "@/types";
import { EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";

function simulateToggle(type: EmployeeType, next: EmployeeStatus): Promise<EmployeeStatus> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (type === "receptionist" && next === "active") {
        reject(new Error("AI Receptionist needs setup before it can go active."));
        return;
      }
      resolve(next);
    }, 450);
  });
}

export function useToggleEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, next }: { type: EmployeeType; next: EmployeeStatus }) => {
      return simulateToggle(type, next);
    },
    onMutate: async ({ type, next }) => {
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      await queryClient.cancelQueries({ queryKey: ["employee", type] });

      const prevList = queryClient.getQueryData<AIEmployeeConfig[]>(["employees"]);
      const prevOne = queryClient.getQueryData<AIEmployeeConfig>(["employee", type]);

      queryClient.setQueryData<AIEmployeeConfig[]>(["employees"], (old) =>
        old?.map((e) => (e.type === type ? { ...e, status: next } : e)),
      );
      queryClient.setQueryData<AIEmployeeConfig>(["employee", type], (old) =>
        old ? { ...old, status: next } : old,
      );

      return { prevList, prevOne, type };
    },
    onError: (err, { type }, ctx) => {
      if (ctx?.prevList) queryClient.setQueryData(["employees"], ctx.prevList);
      if (ctx?.prevOne) queryClient.setQueryData(["employee", type], ctx.prevOne);
      toast.error("Couldn't update status", {
        description: err instanceof Error ? err.message : `${EMPLOYEE_LABELS[type]} status change failed.`,
      });
    },
    onSuccess: (_status, { type, next }) => {
      toast.success(`${EMPLOYEE_LABELS[type]} ${next === "active" ? "activated" : "paused"}`);
    },
    onSettled: (_data, _err, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", type] });
    },
  });
}
