import { ExternalLink, FileCheck2, FilePen, FilePlus2, Newspaper, Pencil, Plus, Trash2, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { blocksToText, textToBlocks } from '../../../shared/blogFormat'
import { BLOG_CATEGORIES } from '../../../shared/constants'
import type { BlogPostRecord, BlogStatus } from '../../../shared/types'
import { slugify } from '../../../shared/validation'
import { api, ApiError } from '../../shared/api'
import { previewUrl } from '../../shared/images'
import { useCurrentUser } from '../auth/AuthContext'
import { ConfirmDialog, Dialog } from '../components/Modal'
import { RowMenu } from '../components/RowMenu'
import { useToast } from '../components/Toast'
import { Field, ImageInput, Toggle } from '../components/form'
import { BlogBadge, EmptyState, ErrorNotice, PageHeader, SearchBox, StatGrid, TableFooter, TableSkeleton } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useQueryParam } from '../hooks/useQueryParam'
import { paginate } from '../lib/format'
import { useForm } from '../hooks/useForm'
import './pages.css'

type Draft = {
  title: string
  slug: string
  excerpt: string
  category: string
  author: string
  image: string | null
  imageAlt: string
  bodyText: string
  status: BlogStatus
  featured: boolean
  publishDate: string
}

const toDraft = (p: BlogPostRecord): Draft => ({
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt,
  category: p.category,
  author: p.author,
  image: p.image || null,
  imageAlt: p.imageAlt,
  bodyText: blocksToText(p.body),
  status: p.status,
  featured: p.featured,
  publishDate: p.publishDate,
})

function BlogEditor({ post, author, onClose, onSaved }: { post: BlogPostRecord | null; author: string; onClose: () => void; onSaved: () => void }) {
  const [slugTouched, setSlugTouched] = useState(!!post)
  const { values, set, errors, setErrors, submitting, submit } = useForm<Draft>(
    post
      ? toDraft(post)
      : {
          title: '',
          slug: '',
          excerpt: '',
          category: BLOG_CATEGORIES[0],
          author,
          image: null,
          imageAlt: '',
          bodyText: '',
          status: 'draft',
          featured: false,
          publishDate: new Date().toISOString().slice(0, 10),
        },
  )
  const notify = useToast()

  const save = async (status: BlogStatus) => {
    const ok = await submit(async (v) => {
      const body = { ...v, status, image: v.image ?? '', body: textToBlocks(v.bodyText) }
      await api(post ? `/admin/blogs/${post.id}` : '/admin/blogs', { method: post ? 'PUT' : 'POST', body })
    })
    if (ok) {
      notify(status === 'published' ? 'Post published' : 'Draft saved')
      onSaved()
    }
  }

  return (
    <Dialog
      title={post ? 'Edit Blog Post' : 'Add Blog'}
      subtitle={post ? post.title : 'Write a company news story, project update or industry guide'}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        save(values.status)
      }}
      footer={
        <>
          <button type="button" className="btn btn--secondary spacer" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--secondary" disabled={submitting} onClick={() => save('draft')}>
            Save as Draft
          </button>
          <button type="button" className="btn btn--primary" disabled={submitting} onClick={() => save('published')}>
            {submitting && <span className="spinner" />}
            {post?.status === 'published' ? 'Update & Publish' : 'Publish'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Title" required error={errors.title} className="span-2">
          {(a) => (
            <input
              {...a}
              className="input"
              value={values.title}
              placeholder="e.g. Asphalt Paving Through Qatar's Summer Heat"
              onChange={(e) => {
                set('title', e.target.value)
                if (!slugTouched) set('slug', slugify(e.target.value))
              }}
            />
          )}
        </Field>
        <Field label="URL slug" error={errors.slug} hint={`/blogs/${values.slug || 'your-post-title'}`}>
          {(a) => (
            <input
              {...a}
              className="input"
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', slugify(e.target.value))
              }}
            />
          )}
        </Field>
        <Field label="Category" required error={errors.category}>
          {(a) => (
            <select {...a} className="select" value={values.category} onChange={(e) => set('category', e.target.value)}>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Author" required error={errors.author}>
          {(a) => <input {...a} className="input" value={values.author} onChange={(e) => set('author', e.target.value)} />}
        </Field>
        <Field label="Publish date" required error={errors.publishDate} hint="Future dates stay hidden until that day.">
          {(a) => <input {...a} className="input" type="date" value={values.publishDate} onChange={(e) => set('publishDate', e.target.value)} />}
        </Field>
        <Field label="Excerpt" required error={errors.excerpt} className="span-2" hint="One or two sentences shown on the blog listing.">
          {(a) => <textarea {...a} className="textarea" style={{ minHeight: 72 }} maxLength={300} value={values.excerpt} onChange={(e) => set('excerpt', e.target.value)} />}
        </Field>
        <div className="span-2">
          <ImageInput folder="blogs" label="Cover image" value={values.image} onChange={(v) => set('image', v)} error={errors.image} />
        </div>
        <Field label="Image description (alt text)" error={errors.imageAlt} className="span-2" hint="Describe the photo for screen-reader users.">
          {(a) => <input {...a} className="input" value={values.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />}
        </Field>
        <Field
          label="Content"
          required
          error={errors.body}
          className="span-2"
          hint={
            <span className="markup-help">
              <span>
                <code>## </code> heading
              </span>
              <span>
                <code>&gt; </code> pull quote
              </span>
              <span>
                <code>- </code> list item
              </span>
              <span>Blank line between paragraphs</span>
            </span>
          }
        >
          {(a) => (
            <textarea
              {...a}
              className="textarea textarea--tall"
              value={values.bodyText}
              onChange={(e) => {
                set('bodyText', e.target.value)
                // The API reports content errors as 'body'.
                if (errors.body) setErrors(({ body: _body, ...rest }) => rest)
              }}
            />
          )}
        </Field>
        <div className="span-2">
          <Toggle label="Featured Post" description="Show this post as the large featured article on the Blogs page" checked={values.featured} onChange={(v) => set('featured', v)} />
        </div>
      </div>
    </Dialog>
  )
}

export default function BlogsPage() {
  const user = useCurrentUser()
  const { data, error, loading, reload } = useApi<BlogPostRecord[]>('/admin/blogs')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'' | BlogStatus>('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<BlogPostRecord | null>(null)
  // The open editor lives in the URL: ?edit=new creates, ?edit=12 edits (used by search and quick actions).
  const [editParam, setEditParam] = useQueryParam('edit')
  const editing: BlogPostRecord | 'new' | null = editParam === 'new' ? 'new' : editParam ? (data?.find((x) => x.id === Number(editParam)) ?? null) : null
  const setEditing = (value: BlogPostRecord | 'new' | null) => setEditParam(value === null ? null : value === 'new' ? 'new' : String(value.id))
  const notify = useToast()

  const all = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter(
      (p) => (!category || p.category === category) && (!status || p.status === status) && (!q || [p.title, p.excerpt, p.author].some((f) => f.toLowerCase().includes(q))),
    )
  }, [all, query, category, status])
  const { rows, pages, current, start } = paginate(filtered, page)

  const setPublished = async (post: BlogPostRecord, next: BlogStatus) => {
    try {
      await api(`/admin/blogs/${post.id}`, { method: 'PUT', body: { ...post, status: next } })
      notify(next === 'published' ? 'Post published' : 'Post moved to drafts')
      reload()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not update the post.', 'error')
    }
  }

  const categories = Array.from(new Set([...BLOG_CATEGORIES, ...all.map((p) => p.category)]))

  return (
    <>
      <PageHeader
        title="Blogs"
        description="Publish company news, project updates and industry guides"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <Plus /> Add Blog
          </button>
        }
      />

      <StatGrid
        loading={loading}
        stats={[
          { label: 'Total Posts', value: all.length, icon: Newspaper, tone: 'navy' },
          { label: 'Published', value: all.filter((p) => p.status === 'published').length, icon: FileCheck2, tone: 'red' },
          { label: 'Drafts', value: all.filter((p) => p.status === 'draft').length, icon: FilePen, tone: 'gold' },
        ]}
      />

      <section className="card" aria-label="Blog posts">
        <div className="toolbar">
          <SearchBox label="Search blog posts" placeholder="Search blog posts…" value={query} onChange={(v) => (setQuery(v), setPage(1))} />
          <select className="select" aria-label="Filter by category" value={category} onChange={(e) => (setCategory(e.target.value), setPage(1))}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="select" aria-label="Filter by status" value={status} onChange={(e) => (setStatus(e.target.value as BlogStatus | ''), setPage(1))}>
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {error && (
          <div style={{ padding: '0 24px' }}>
            <ErrorNotice message={error.message} onRetry={reload} />
          </div>
        )}

        {loading ? (
          <TableSkeleton cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={all.length ? 'No posts match your filters' : 'No blog posts yet'}
            text={all.length ? 'Try a different search, category or status.' : 'Write your first article to publish it on the website.'}
            action={
              !all.length && (
                <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
                  <FilePlus2 /> Add Blog
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Category</th>
                  <th scope="col">Author</th>
                  <th scope="col">Publish Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="col-action">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const thumb = previewUrl(p.image)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-media">
                          {thumb ? (
                            <img className="thumb" src={thumb} alt="" loading="lazy" />
                          ) : (
                            <span className="thumb thumb--empty">
                              <Newspaper />
                            </span>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <button type="button" className="cell-title row-link" onClick={() => setEditing(p)}>
                              {p.title}
                            </button>
                            <span className="cell-sub">{p.excerpt}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="pill">{p.category}</span>
                      </td>
                      <td className="nowrap">{p.author}</td>
                      <td className="nowrap">{p.publishDate}</td>
                      <td>
                        <BlogBadge status={p.status} />
                      </td>
                      <td className="col-action">
                        <RowMenu
                          label={`Actions for ${p.title}`}
                          actions={[
                            { label: 'Edit', icon: Pencil, onSelect: () => setEditing(p) },
                            { label: 'View on website', icon: ExternalLink, onSelect: () => window.open(`/blogs/${p.slug}`, '_blank', 'noopener'), hidden: p.status !== 'published' },
                            { label: 'Publish', icon: FileCheck2, onSelect: () => setPublished(p, 'published'), hidden: p.status === 'published' },
                            { label: 'Move to Drafts', icon: Undo2, onSelect: () => setPublished(p, 'draft'), hidden: p.status === 'draft' },
                            { label: 'Delete', icon: Trash2, onSelect: () => setDeleting(p), danger: true },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <TableFooter total={filtered.length} page={current} pages={pages} start={start} onPage={setPage} />
      </section>

      {editing && (
        <BlogEditor
          post={editing === 'new' ? null : editing}
          author={user.name}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete blog post?"
          message={`"${deleting.title}" will be permanently deleted and removed from the website.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/blogs/${deleting.id}`, { method: 'DELETE' })
              notify('Post deleted')
              reload()
            } catch (err) {
              notify(err instanceof ApiError ? err.message : 'Could not delete.', 'error')
            }
          }}
        />
      )}
    </>
  )
}
