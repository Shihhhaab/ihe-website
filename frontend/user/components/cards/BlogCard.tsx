import { Link } from 'react-router-dom'
import { formatDate, type BlogPost } from '../../data/blogs'
import { Img } from '../ui/Img'
import './cards.css'

/** Article teaser used in blog grids and related-post lists. */
export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="blog-card">
      <Link to={`/blogs/${post.slug}`} className="blog-card__link">
        <div className="blog-card__media">
          <Img name={post.image} alt={post.imageAlt} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
          <span className="blog-card__category mono">{post.category}</span>
        </div>
        <div className="blog-card__body">
          <p className="blog-card__meta mono">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readMinutes} min read</span>
          </p>
          <h3 className="blog-card__title">{post.title}</h3>
          <p className="blog-card__excerpt">{post.excerpt}</p>
          <span className="blog-card__more">
            Read more
            <span className="blog-card__more-line" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}
