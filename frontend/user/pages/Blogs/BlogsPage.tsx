import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MaskImage } from '../../components/animations/MaskImage'
import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal } from '../../components/animations/Reveal'
import { Button } from '../../components/buttons/Button'
import { BlogCard } from '../../components/cards/BlogCard'
import { CtaBand } from '../../components/sections/CtaBand'
import { PageHero } from '../../components/sections/PageHero'
import { SectionHeader } from '../../components/sections/SectionHeader'
import { FilterTabs } from '../../components/ui/FilterTabs'
import { categoriesOf, formatDate } from '../../data/blogs'
import { useBlogPosts } from '../../hooks/usePublicContent'
import { usePageMeta } from '../../hooks/usePageMeta'
import { EASE_OUT } from '../../lib/motion'
import './blogs.css'

export default function BlogsPage() {
  usePageMeta('Blogs', 'News and insights on roads, infrastructure, earthworks and site safety in Qatar.')
  const [category, setCategory] = useState('All')

  const { data: blogPosts } = useBlogPosts()
  const blogCategories = categoriesOf(blogPosts)
  const featured = blogPosts.find((p) => p.featured) ?? blogPosts[0]
  const others = blogPosts.filter((p) => p !== featured)
  const visible = others.filter((p) => category === 'All' || p.category === category)

  return (
    <div className="page">
      <PageHero
        pageIndex="05 / 06"
        crumb="Blogs"
        eyebrow="Blogs & insights"
        title={['Notes from', 'the field']}
        accentLine={1}
        intro="Perspectives on roads, earthworks, asphalt, material supply and site safety from across Qatar’s infrastructure sector."
        image="ihe-asphalt-paving"
        imageAlt="I.H.E. crew laying asphalt on a road project"
      />

      {/* Featured article */}
      {featured && (
        <section className="section section--white blog-feature" aria-labelledby="blog-feature-title">
          <div className="container">
            <Reveal className="section-header__meta">
              <span className="section-header__index mono">01</span>
              <span className="eyebrow">Featured article</span>
            </Reveal>
            <article className="blog-feature__card">
              <Link to={`/blogs/${featured.slug}`} className="blog-feature__media" tabIndex={-1} aria-hidden="true">
                <MaskImage name={featured.image} alt="" className="blog-feature__img" sizes="(max-width: 900px) 100vw, 60vw" />
              </Link>
              <div className="blog-feature__body">
                <Reveal as="p" className="blog-feature__meta mono">
                  <span className="blog-feature__cat">{featured.category}</span>
                  <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                  <span>{featured.readMinutes} min read</span>
                </Reveal>
                <MaskLines
                  id="blog-feature-title"
                  as="h2"
                  lines={[featured.title]}
                  className="h3 blog-feature__title"
                />
                <Reveal delay={0.1}>
                  <p className="lead muted">{featured.excerpt}</p>
                </Reveal>
                <Reveal delay={0.2}>
                  <Button to={`/blogs/${featured.slug}`} variant="dark">
                    Read more<span className="sr-only">: {featured.title}</span>
                  </Button>
                </Reveal>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* All articles */}
      <section className="section section--light blog-list" aria-labelledby="blog-list-title">
        <div className="container">
          <SectionHeader
            id="blog-list-title"
            index="02"
            eyebrow="All articles"
            title={['Latest', 'articles']}
            accentLine={1}
            aside={
              <FilterTabs id="blog-filter" label="Filter articles by category" options={blogCategories} value={category} onChange={setCategory} />
            }
          />

          <motion.ul layout className="blog-grid" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((post, i) => (
                <motion.li
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.8, ease: EASE_OUT, delay: (i % 3) * 0.08 }}
                >
                  <BlogCard post={post} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
          {visible.length === 0 && <p className="muted blog-empty">No articles in this category yet.</p>}
        </div>
      </section>

      <CtaBand />
    </div>
  )
}
