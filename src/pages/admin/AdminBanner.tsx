import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { AdminShell } from '@/components/admin/AdminShell'
import { getAdminBanner, saveAdminBanner, uploadProductImage, getVideoUploadTarget, type HomeBanner } from '@/services/api'
import { getSupabase } from '@/lib/supabase'
import { compressImage } from '@/lib/media'

const MAX_VIDEO_MB = 50
const empty: HomeBanner = { type: '', url: '', line1: '', line2: '' }

export function AdminBanner() {
  const [banner, setBanner] = useState<HomeBanner>(empty)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getAdminBanner()
      .then((b) => setBanner({ ...empty, ...b }))
      .catch((e: any) => toast.error(e?.message || 'Could not load the banner'))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof HomeBanner>(key: K, value: HomeBanner[K]) => setBanner((b) => ({ ...b, [key]: value }))

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      if (file.type.startsWith('image/')) {
        setBusy('Uploading photo…')
        const { url } = await uploadProductImage(await compressImage(file, 2000))
        setBanner((b) => ({ ...b, type: 'image', url }))
      } else if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
          toast.error(`Video is too big. Keep it under ${MAX_VIDEO_MB} MB (a short 10–20 second clip is best).`)
          return
        }
        const type = file.type === 'video/quicktime' ? 'video/quicktime' : file.type
        setBusy('Uploading video… this can take a minute')
        const target = await getVideoUploadTarget(type)
        let supabase
        try {
          supabase = getSupabase()
        } catch {
          throw new Error('Video upload needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel settings.')
        }
        const { error } = await supabase.storage.from('site-media').uploadToSignedUrl(target.path, target.token, file, { contentType: type })
        if (error) throw new Error(error.message || 'Video upload failed')
        setBanner((b) => ({ ...b, type: 'video', url: target.publicUrl }))
      } else {
        toast.error('Choose a photo or a video')
        return
      }
      toast.success('Uploaded. Tap Save to publish it.')
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setBusy('')
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await saveAdminBanner(banner)
      toast.success('Banner saved')
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the banner')
    } finally {
      setSaving(false)
    }
  }

  const resetMedia = () => setBanner((b) => ({ ...b, type: '', url: '' }))

  return (
    <AdminShell title="Homepage banner" subtitle="The big photo or video at the top of your website">
      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : (
        <>
          <div className="adm-banner-preview">
            {banner.url && banner.type === 'video' ? (
              <video src={banner.url} autoPlay loop muted playsInline />
            ) : banner.url && banner.type === 'image' ? (
              <img src={banner.url} alt="" />
            ) : (
              <span>Using the default banner</span>
            )}
            {(banner.line1 || banner.line2 || banner.url) && (
              <div className="adm-banner-text">
                <div>{banner.line1 || 'The New'}</div>
                <em>{banner.line2 || 'Collection'}</em>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" hidden onChange={onPick} />
          <button className="adm-btn block" style={{ marginTop: 14 }} disabled={!!busy} onClick={() => fileRef.current?.click()}>
            {busy || (banner.url ? 'Change photo or video' : 'Choose photo or video')}
          </button>
          {banner.url && !busy && (
            <button className="adm-text danger" onClick={resetMedia}>Remove and use default</button>
          )}
          <p className="adm-sub">Videos play muted on a loop. Keep them short, under {MAX_VIDEO_MB} MB.</p>

          <label className="adm-label">Heading, line 1</label>
          <input className="adm-in" value={banner.line1} onChange={(e) => set('line1', e.target.value)} placeholder="The New" maxLength={60} />

          <label className="adm-label">Heading, line 2 (shown in italics)</label>
          <input className="adm-in" value={banner.line2} onChange={(e) => set('line2', e.target.value)} placeholder="Collection" maxLength={60} />

          <button className="adm-btn block" style={{ marginTop: 28 }} onClick={save} disabled={saving || !!busy}>
            {saving ? 'Saving…' : 'Save banner'}
          </button>
        </>
      )}
    </AdminShell>
  )
}
