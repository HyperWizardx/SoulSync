/** Compra, uso y equipamiento de objetos con sus avisos y actualización de consultas. */
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { buyItem, useItem as useItemServer, toggleEquip } from '@/service/server-functions/store.functions';
import { emitFeedback } from '@/shared/feedback';
export function useInventoryActions() {
  const qc = useQueryClient();
  const buyItemFn = useServerFn(buyItem);
  const useItemFn = useServerFn(useItemServer);
  const toggleEquipFn = useServerFn(toggleEquip);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['progress'] });
  const buyMut = useMutation({
    mutationFn: (d: { itemName: string; price: number; currency: "coins" | "gems" }) =>
      buyItemFn({ data: d }),
    onSuccess: (res) => {
      for (const code of res.unlockedAchievements ?? []) emitFeedback({ type: "achievement", code });
      invalidate();
      qc.invalidateQueries({ queryKey: ["profile-summary"] });
    },
  });

  const useItemMut = useMutation({
    mutationFn: (itemKey: string) => useItemFn({ data: { itemKey } }),
    onSuccess: (res) => {
      for (const code of res.unlockedAchievements ?? []) emitFeedback({ type: "achievement", code });
      invalidate();
      qc.invalidateQueries({ queryKey: ["wellbeing"] });
      qc.invalidateQueries({ queryKey: ["profile-summary"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo usar el objeto"),
  });

  const equipMut = useMutation({
    mutationFn: (itemKey: string) => toggleEquipFn({ data: { itemKey } }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo equipar"),
  });

  const buyItemAction = useCallback(
    async (itemName: string, price: number, currency: "coins" | "gems") => {
      try {
        await buyMut.mutateAsync({ itemName, price, currency });
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo comprar");
        return false;
      }
    },
    [buyMut]
  );

  const useItemAction = useCallback(
    async (itemKey: string) => {
      try {
        await useItemMut.mutateAsync(itemKey);
        return true;
      } catch {
        return false;
      }
    },
    [useItemMut]
  );

  const toggleEquipAction = useCallback(
    async (itemKey: string) => {
      try {
        await equipMut.mutateAsync(itemKey);
        return true;
      } catch {
        return false;
      }
    },
    [equipMut]
  );

  return { buyItem: buyItemAction, useItem: useItemAction, toggleEquip: toggleEquipAction };
}
