import UrlForm from "@/components/UrlForm";

export const metadata = { title: "إنشاء رابط" };

export default function CreatePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">إنشاء رابط مختصر</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          الصق رابطك الطويل واحصل على رابط قصير فورًا، مع خيارات التخصيص والانتهاء.
        </p>
      </div>
      <div className="mt-10">
        <UrlForm />
      </div>
    </section>
  );
}
