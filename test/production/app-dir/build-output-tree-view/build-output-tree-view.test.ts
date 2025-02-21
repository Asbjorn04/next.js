import { nextTestSetup } from 'e2e-utils'
import path from 'path'

describe('build-output-tree-view', () => {
  describe('with mixed static and dynamic pages and app router routes', () => {
    const { next } = nextTestSetup({
      files: path.join(__dirname, 'fixtures/mixed'),
      skipStart: true,
      env: {
        __NEXT_PRIVATE_DETERMINISTIC_BUILD_OUTPUT: '1',
      },
    })

    beforeAll(() => next.build())

    it('should show info about prerendered and dynamic routes in a tree view', async () => {
      // TODO: Fix double-listing of the /ppr/[slug] fallback.

      expect(getTreeView(next.cliOutput)).toMatchInlineSnapshot(`
       "Route (app)                     Size  First Load JS    Cache Life
       ┌ ○ /_not-found                42 kB          42 kB
       ├ ƒ /api                       42 kB          42 kB
       ├ ○ /api/force-static          42 kB          42 kB
       ├ ○ /app-static                42 kB          42 kB
       ├ ○ /cache-life                42 kB          42 kB     1 h / 1 d
       ├ ƒ /dynamic                   42 kB          42 kB
       ├ ◐ /ppr/[slug]                42 kB          42 kB    1 w / 30 d
       ├   ├ /ppr/[slug]                                      1 w / 30 d
       ├   ├ /ppr/[slug]                                      1 w / 30 d
       ├   ├ /ppr/days                                         1 d / 1 w
       ├   └ /ppr/weeks                                       1 w / 30 d
       └ ○ /revalidate                42 kB          42 kB  15 min / 1 y
       + First Load JS shared by all  42 kB

       Route (pages)                   Size  First Load JS    Cache Life
       ┌ ƒ /api/hello                 42 kB          42 kB
       ├ ● /gsp-revalidate            42 kB          42 kB   5 min / 1 y
       ├ ƒ /gssp                      42 kB          42 kB
       └ ○ /static                    42 kB          42 kB
       + First Load JS shared by all  42 kB

       ○  (Static)             prerendered as static content
       ●  (SSG)                prerendered as static HTML (uses generateStaticParams)
       ◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
       ƒ  (Dynamic)            server-rendered on demand
          (Cache Life)         revalidate / expire"
      `)
    })
  })

  describe('with only a few static routes', () => {
    const { next } = nextTestSetup({
      files: path.join(__dirname, 'fixtures/minimal-static'),
      skipStart: true,
      env: {
        __NEXT_PRIVATE_DETERMINISTIC_BUILD_OUTPUT: '1',
      },
    })

    beforeAll(() => next.build())

    it('should show info about prerendered routes in a compact tree view', async () => {
      expect(getTreeView(next.cliOutput)).toMatchInlineSnapshot(`
       "Route (app)                     Size  First Load JS
       ┌ ○ /                          42 kB          42 kB
       └ ○ /_not-found                42 kB          42 kB
       + First Load JS shared by all  42 kB

       Route (pages)                   Size  First Load JS
       ─ ○ /static                    42 kB          42 kB
       + First Load JS shared by all  42 kB

       ○  (Static)  prerendered as static content"
      `)
    })
  })
})

function getTreeView(cliOutput: string): string {
  let foundBuildTracesLine = false
  const lines: string[] = []

  for (const line of cliOutput.split('\n')) {
    if (foundBuildTracesLine) {
      lines.push(line)
    }

    foundBuildTracesLine ||= line.includes('Collecting build traces')
  }

  // Remove leading and trailing empty newlines.
  while (lines.at(0) === '') lines.shift()
  while (lines.at(-1) === '') lines.pop()

  return lines.join('\n')
}
