'use client'

import { useEffect, useMemo, useState } from 'react'

type Banner = {
  id: string
  title: string
  image_url: string
  link: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type BannerFormState = {
  title: string
  link: string
  display_order: string
  is_active: boolean
  file: File | null
}

const EMPTY_FORM: BannerFormState = {
  title: '',
  link: '',
  display_order: '0',
  is_active: true,
  file: null,
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<BannerFormState>(EMPTY_FORM)
  const [editing, setEditing] = useState<Record<string, Omit<Banner, 'created_at' | 'updated_at'>>>({})
  const [busyBannerId, setBusyBannerId] = useState<string | null>(null)

  async function loadBanners() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/banners', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load banners')
      }

      setBanners(data.banners ?? [])
      setEditing(
        Object.fromEntries(
          (data.banners ?? []).map((banner: Banner) => [
            banner.id,
            {
              id: banner.id,
              title: banner.title,
              image_url: banner.image_url,
              link: banner.link,
              display_order: banner.display_order,
              is_active: banner.is_active,
            },
          ])
        )
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBanners()
  }, [])

  const selectedFileLabel = useMemo(() => form.file?.name ?? 'لم يتم اختيار ملف', [form.file])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.file) {
      setError('Banner image is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const uploadBody = new FormData()
      uploadBody.append('file', form.file)

      const uploadResponse = await fetch('/api/admin/banners/upload', {
        method: 'POST',
        body: uploadBody,
      })
      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Banner upload failed')
      }

      const createResponse = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          image_url: uploadData.image_url,
          link: form.link || null,
          display_order: Number.parseInt(form.display_order, 10) || 0,
          is_active: form.is_active,
        }),
      })

      const createData = await createResponse.json()
      if (!createResponse.ok) {
        throw new Error(createData.error || 'Failed to create banner')
      }

      setForm(EMPTY_FORM)
      await loadBanners()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create banner')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: string) {
    const draft = editing[id]
    if (!draft) return

    setBusyBannerId(id)
    setError(null)

    try {
      const response = await fetch('/api/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: draft.title,
          link: draft.link,
          display_order: draft.display_order,
          is_active: draft.is_active,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update banner')
      }

      await loadBanners()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update banner')
    } finally {
      setBusyBannerId(null)
    }
  }

  async function handleDelete(id: string) {
    setBusyBannerId(id)
    setError(null)

    try {
      const response = await fetch('/api/admin/banners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete banner')
      }

      await loadBanners()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to delete banner')
    } finally {
      setBusyBannerId(null)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400">{banners.length} banner(s)</p>
        <h2 className="text-xl font-black text-gray-900">إدارة البانرات</h2>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">عنوان البانر</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-rose-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">الرابط</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setForm((current) => ({ ...current, link: e.target.value }))}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-rose-400 focus:bg-white"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">الترتيب</label>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm((current) => ({ ...current, display_order: e.target.value }))}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-rose-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">صورة البانر</label>
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-500 transition hover:border-rose-300 hover:text-gray-900">
              <span className="truncate">{selectedFileLabel}</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-rose-500">اختر ملف</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => setForm((current) => ({ ...current, file: e.target.files?.[0] ?? null }))}
              />
            </label>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((current) => ({ ...current, is_active: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300"
          />
          فعال
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'جاري الرفع والحفظ...' : 'رفع البانر وحفظه'}
        </button>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center text-sm font-bold text-gray-400 shadow-sm">
            جاري تحميل البانرات...
          </div>
        ) : banners.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center text-sm font-bold text-gray-400 shadow-sm">
            لا توجد بانرات بعد.
          </div>
        ) : (
          banners.map((banner) => {
            const draft = editing[banner.id]
            const isBusy = busyBannerId === banner.id

            return (
              <div key={banner.id} className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      value={draft?.title ?? ''}
                      onChange={(e) =>
                        setEditing((current) => ({
                          ...current,
                          [banner.id]: { ...(current[banner.id] ?? banner), title: e.target.value },
                        }))
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-rose-400 focus:bg-white"
                    />
                    <input
                      type="url"
                      value={draft?.link ?? ''}
                      onChange={(e) =>
                        setEditing((current) => ({
                          ...current,
                          [banner.id]: { ...(current[banner.id] ?? banner), link: e.target.value || null },
                        }))
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-rose-400 focus:bg-white"
                    />
                    <input
                      type="number"
                      value={draft?.display_order ?? 0}
                      onChange={(e) =>
                        setEditing((current) => ({
                          ...current,
                          [banner.id]: {
                            ...(current[banner.id] ?? banner),
                            display_order: Number.parseInt(e.target.value, 10) || 0,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-rose-400 focus:bg-white"
                    />
                    <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={draft?.is_active ?? false}
                        onChange={(e) =>
                          setEditing((current) => ({
                            ...current,
                            [banner.id]: { ...(current[banner.id] ?? banner), is_active: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      فعال
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleUpdate(banner.id)}
                      className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isBusy ? 'جاري الحفظ...' : 'حفظ التعديل'}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleDelete(banner.id)}
                      className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      حذف البانر
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
