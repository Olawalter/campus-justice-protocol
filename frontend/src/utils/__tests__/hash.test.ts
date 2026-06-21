import { hashString, hashFile, hashFiles } from '../hash'

describe('hashString', () => {
  it('produces a 64-char hex string', async () => {
    const h = await hashString('hello')
    expect(h).toHaveLength(64)
    expect(h).toMatch(/^[0-9a-f]+$/)
  })

  it('is deterministic', async () => {
    const h1 = await hashString('campus-justice-protocol')
    const h2 = await hashString('campus-justice-protocol')
    expect(h1).toBe(h2)
  })

  it('produces different hashes for different inputs', async () => {
    const h1 = await hashString('document-a')
    const h2 = await hashString('document-b')
    expect(h1).not.toBe(h2)
  })

  it('produces a consistent well-known value for empty string', async () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const h = await hashString('')
    expect(h).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})

describe('hashFile', () => {
  function makeFile(content: string, name = 'test.txt'): File {
    return new File([content], name, { type: 'text/plain' })
  }

  it('hashes a file and returns a hex string', async () => {
    const file = makeFile('test content')
    const h = await hashFile(file)
    expect(h).toHaveLength(64)
    expect(h).toMatch(/^[0-9a-f]+$/)
  })

  it('same content → same hash', async () => {
    const f1 = makeFile('identical content')
    const f2 = makeFile('identical content')
    const h1 = await hashFile(f1)
    const h2 = await hashFile(f2)
    expect(h1).toBe(h2)
  })

  it('different content → different hash', async () => {
    const f1 = makeFile('original')
    const f2 = makeFile('tampered')
    expect(await hashFile(f1)).not.toBe(await hashFile(f2))
  })
})

describe('hashFiles', () => {
  it('returns one hash per file', async () => {
    const files = [
      new File(['aaa'], 'a.pdf'),
      new File(['bbb'], 'b.pdf'),
      new File(['ccc'], 'c.pdf'),
    ]
    const hashes = await hashFiles(files)
    expect(hashes).toHaveLength(3)
    expect(new Set(hashes).size).toBe(3)
  })

  it('handles empty array', async () => {
    const hashes = await hashFiles([])
    expect(hashes).toEqual([])
  })
})
