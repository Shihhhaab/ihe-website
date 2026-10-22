import { motion } from 'motion/react'
import { ArrowLeft, Check, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MaskImage } from '../../components/animations/MaskImage'
import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal, RevealGroup, RevealItem } from '../../components/animations/Reveal'
import { BlogCard } from '../../components/cards/BlogCard'
import { CtaBand } from '../../components/sections/CtaBand'
import { LinkedInIcon } from '../../components/ui/LinkedInIcon'
import { formatDate, type BlogBlock } from '../../data/blogs'
import { useBlogPosts } from '../../hooks/usePublicContent'
import { usePageMeta } from '../../hooks/usePageMeta'
import { EASE_OUT } from '../../lib/motion'
import NotFoundPage from '../NotFound/NotFoundPage'
import './blogs.css'

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="article__h2">{block.text}</h2>
    case 'quote':
      return <blockquote className="article__quote">{block.text}</blockquote>
    case 'list':
      return (
        <ul className="article__list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    default:
      return <p>{block.text}</p>
  }
}

export default function BlogDetailPage() {
  const { slug = '' } = useParams()
  const { data: blogPosts, settled } = useBlogPosts()
  const post = blogPosts.find((p) => p.slug === slug)
  usePageMeta(post?.title ?? 'Article not found', post?.excerpt)
  const [copied, setCopied] = useState(false)

  // A post created in the admin panel isn't in the bundled content, so wait for the API before showing 404.
  if (!post) return settled ? <NotFoundPage /> : <div className="page page--loading" aria-busy="true" />

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="page">
      <header className="article-hero">
        <div className="container article-hero__inner">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT }}
          >
            <Link to="/blogs" className="article-hero__back mono">
              <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" /> All articles
            </Link>
          </motion.div>
          <motion.p
            className="article-hero__meta mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <span className="blog-feature__cat">{post.category}</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>{post.readMinutes} min read</span>
          </motion.p>
          <MaskLines as="h1" lines={[post.title]} className="article-hero__title" immediate delay={0.6} />
          <motion.p
            className="lead article-hero__excerpt"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: EASE_OUT }}
          >
            {post.excerpt}
          </motion.p>
        </div>
      </header>

      <div className="article-cover">
        <div className="container">
          <MaskImage name={post.image} alt={post.imageAlt} className="article-cover__img" sizes="(max-width: 1320px) 100vw, 1320px" priority />
        </div>
      </div>

      <section className="section section--white article" aria-label="Article">
        <div className="container article__grid">
          <aside className="article__aside" aria-label="Share">
            <p className="mono article__aside-label">Share</p>
            <div className="article__share">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn (opens in a new tab)"
              >
                <LinkedInIcon size={16} />
              </a>
              <button type="button" onClick={copyLink} aria-label={copied ? 'Link copied' : 'Copy link'}>
                {copied ? <Check size={16} strokeWidth={1.75} /> : <Link2 size={16} strokeWidth={1.75} />}
              </button>
            </div>
            <span className="sr-only" aria-live="polite">
              {copied ? 'Link copied to clipboard' : ''}
            </span>
          </aside>
          <Reveal as="article" className="article__body">
            {post.body.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section section--light related" aria-labelledby="related-title">
        <div className="container">
          <Reveal className="related__head">
            <h2 id="related-title" className="h3">
              More articles
            </h2>
            <Link to="/blogs" className="text-link">
              <span>View all</span>
            </Link>
          </Reveal>
          <RevealGroup as="ul" className="blog-grid" stagger={0.1}>
            {related.map((p) => (
              <RevealItem as="li" key={p.slug}>
                <BlogCard post={p} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <CtaBand />
    </div>
  )
}
