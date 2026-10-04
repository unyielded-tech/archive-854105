import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { getArticles, getArticleBySlug } from '@/services/firestore'
import type { JournalArticle } from '@/types'
import '@/styles/store.css'

const when = (d: any) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

export function JournalPage() {
  const [articles, setArticles] = useState<JournalArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArticles().then(setArticles).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <MainLayout>
      <div className="st-wrap" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1 className="st-page-title">Journal</h1>
        <p className="st-sub" style={{ marginBottom: 14 }}>Stories, style notes and news from ARCHIVE 854105.</p>
        {loading ? (
          <div className="st-empty">Loading…</div>
        ) : articles.length === 0 ? (
          <div className="st-empty">
            <p>New stories are coming soon.</p>
            <Link to="/shop" className="st-btn" style={{ marginTop: 12 }}>Shop the latest</Link>
          </div>
        ) : (
          <div className="jgrid">
            {articles.map((a) => (
              <Link key={a.id} to={`/journal/${a.slug}`} className="jcard">
                <div className="jcard-img">{a.coverImage && <img src={a.coverImage} alt="" loading="lazy" />}</div>
                <div className="jcard-body">
                  <div className="pcard-cat">{[a.category, when(a.publishedAt)].filter(Boolean).join(' · ')}</div>
                  <h3>{a.title}</h3>
                  {a.excerpt && <p className="st-sub" style={{ margin: 0 }}>{a.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export function JournalArticlePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<JournalArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArticleBySlug(slug).then(setArticle).catch(() => {}).finally(() => setLoading(false))
  }, [slug])

  return (
    <MainLayout>
      <div className="st-wrap" style={{ maxWidth: 760, paddingTop: 16, paddingBottom: 40 }}>
        <Link to="/journal" className="st-link">← Journal</Link>
        {loading ? (
          <div className="st-empty">Loading…</div>
        ) : !article ? (
          <div className="st-empty">This story could not be found.</div>
        ) : (
          <article style={{ marginTop: 14 }}>
            <div className="pcard-cat">{[article.category, when(article.publishedAt)].filter(Boolean).join(' · ')}</div>
            <h1 className="st-page-title" style={{ margin: '6px 0 14px' }}>{article.title}</h1>
            {article.coverImage && <img src={article.coverImage} alt="" style={{ width: '100%', marginBottom: 16, border: '1px solid var(--line)' }} />}
            {String(article.content || '').split(/\n{2,}/).map((para, i) => (
              <p key={i} style={{ fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{para}</p>
            ))}
          </article>
        )}
      </div>
    </MainLayout>
  )
}
