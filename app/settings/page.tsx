"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "كلمتا المرور غير متطابقتين" });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" });
      return;
    }

    setSaving(true);
    const res = await api("/api/user", {
      method: "PATCH",
      json: { currentPassword, newPassword },
    });
    setSaving(false);

    if (res.ok) {
      setMessage({ type: "success", text: "تم تغيير كلمة المرور بنجاح." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ type: "error", text: res.error || "حدث خطأ" });
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await api("/api/user", { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.error || "تعذّر حذف الحساب" });
      setConfirmDelete(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">الإعدادات</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إدارة كلمة المرور والحساب الخاص بك.</p>

      {message && (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">تغيير كلمة المرور</h2>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">كلمة المرور الحالية</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">كلمة المرور الجديدة</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">تأكيد كلمة المرور الجديدة</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-2xl bg-indigo-600 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "جارٍ الحفظ…" : "تحديث كلمة المرور"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50/40 p-6 dark:border-rose-900 dark:bg-rose-950/20">
        <h2 className="text-base font-bold text-rose-700 dark:text-rose-400">منطقة الخطر</h2>
        <p className="mt-2 text-sm text-rose-600/80 dark:text-rose-300/80">
          حذف حسابك نهائيًا سيؤدي إلى حذف جميع روابطك وإحصائياتها، ولا يمكن التراجع عن هذا الإجراء.
        </p>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-4 h-11 rounded-2xl bg-rose-600 px-6 text-sm font-bold text-white transition hover:bg-rose-700"
        >
          حذف الحساب نهائيًا
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="حذف الحساب"
        message="هل أنت متأكد؟ سيتم حذف جميع روابطك وإحصائياتها نهائيًا ولا يمكن التراجع."
        confirmLabel="حذف نهائيًا"
        loading={deleting}
        onConfirm={deleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
