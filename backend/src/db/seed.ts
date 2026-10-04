/*
 * First-run seeding from /shared/content (the I.H.E. Company Profile R26.0 and
 * the website's editorial content), so the admin panel starts with exactly what
 * the public site shows. Each collection is only seeded while it is empty, so
 * admin edits are never overwritten. Runs after the migrations (db/migrations.ts).
 */
import { seedBlogPosts } from '../../../shared/content/blogs.ts'
import { companyProfile } from '../../../shared/content/company.ts'
import { TIMEZONES } from '../../../shared/constants.ts'
import { passwordProblem } from '../../../shared/validation.ts'
import { hashPassword } from '../auth/password.ts'
import type { Config } from '../config.ts'
import { insertProfileCertificates, insertProfileProjects, insertProfileServices } from './content.ts'
import type { Db } from './database.ts'
import * as repo from './repositories.ts'

const isEmpty = async (db: Db, collection: string) => (await db.collection(collection).estimatedDocumentCount()) === 0

export async function seed(db: Db, config: Config, log: (msg: string) => void = console.log) {
  if (await isEmpty(db, 'projects')) log(`Seeded ${await insertProfileProjects(db)} projects`)

  if (await isEmpty(db, 'blogs')) {
    const blogs = repo.blogs(db)
    for (const post of seedBlogPosts) {
      await blogs.create({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        author: 'I.H.E. Editorial',
        image: post.image,
        imageAlt: post.imageAlt,
        body: post.body,
        status: 'published',
        featured: !!post.featured,
        publishDate: post.date,
      })
    }
    log(`Seeded ${seedBlogPosts.length} blog posts`)
  }

  if (await isEmpty(db, 'services')) log(`Seeded ${await insertProfileServices(db)} services`)
  if (await isEmpty(db, 'certificates')) log(`Seeded ${await insertProfileCertificates(db)} certificates`)

  const settings = repo.settings(db)
  if (!(await settings.company())) {
    await settings.setCompany({
      companyName: companyProfile.legalName,
      companyEmail: companyProfile.email,
      companyPhone: companyProfile.phone,
      timezone: TIMEZONES[0],
      companyAddress: `${companyProfile.address}. ${companyProfile.poBox}`,
      logoUrl: null,
    })
  }

  const users = repo.users(db)
  if ((await users.count()) === 0) {
    if (!config.initialAdmin) {
      log('No admin users exist. Set ADMIN_EMAIL and ADMIN_PASSWORD (see .env.example) and restart to create the first super admin.')
      return
    }
    const problem = passwordProblem(config.initialAdmin.password)
    if (problem) throw new Error(`ADMIN_PASSWORD rejected: ${problem}`)
    const id = await users.create(
      { name: config.initialAdmin.name, email: config.initialAdmin.email.toLowerCase(), role: 'super_admin', status: 'active' },
      await hashPassword(config.initialAdmin.password),
    )
    await repo.activity(db).log('user', 'Super admin created', `${config.initialAdmin.name} was set up as the first administrator.`)
    log(`Created super admin ${config.initialAdmin.email} (id ${id})`)
  }
}
