import { useCallback, useEffect, useState } from "react";
import {
  listAdminMaster,
  removeAdminItem,
  removeAdminPriority,
  removeAdminStaff,
  saveAdminItem,
  saveAdminPriority,
  saveAdminStaff,
} from "@/lib/utils.functions";
import type { AdminItem, Priority, Staff } from "@/lib/staff";

/** Bentuk balasan server. `admin_items.kode` dipetakan ke `AdminItem.id` supaya
 *  komponen UI tidak perlu tahu nama kolom database. */
type Master = Awaited<ReturnType<typeof listAdminMaster>>;

/** Master data /kelola langsung dari Postgres — pengganti localStorage `pws-admin-*`. */
export function useAdminMaster() {
  const [prios, setPrios] = useState<Priority[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: Master = await listAdminMaster();
      setPrios(data.prios);
      setItems(data.items.map((it) => ({ id: it.kode, prio: it.prio, judul: it.judul, desk: it.desk, on: it.on })));
      setStaff(data.staff);
    } catch {
      setError("Gagal memuat master data dari database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // `nama` = nama lama. `null` berarti baris baru, dikirim sebagai string kosong supaya
  // server tidak salah menganggapnya sebagai rename.
  const savePrio = useCallback(
    async (nama: string | null, row: Priority) => {
      await saveAdminPriority({ data: { nama: nama ?? "", row } });
      await refresh();
    },
    [refresh]
  );

  const removePrio = useCallback(
    async (nama: string) => {
      await removeAdminPriority({ data: { nama } });
      await refresh();
    },
    [refresh]
  );

  const saveItem = useCallback(
    async (kode: string | null, row: AdminItem) => {
      await saveAdminItem({ data: { kode, row } });
      await refresh();
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (kode: string) => {
      await removeAdminItem({ data: { kode } });
      await refresh();
    },
    [refresh]
  );

  const saveStaff = useCallback(
    async (nama: string | null, row: Staff) => {
      await saveAdminStaff({ data: { nama: nama ?? "", row } });
      await refresh();
    },
    [refresh]
  );

  const removeStaff = useCallback(
    async (nama: string) => {
      await removeAdminStaff({ data: { nama } });
      await refresh();
    },
    [refresh]
  );

  return {
    prios,
    items,
    staff,
    loading,
    error,
    refresh,
    savePrio,
    removePrio,
    saveItem,
    removeItem,
    saveStaff,
    removeStaff,
  };
}
