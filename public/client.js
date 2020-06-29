function createObjects (acc, p) {
  // rel="next" => 1: rel 2: next
  var m = p.match(/\s*(.+)\s*=\s*"?([^"]+)"?/)
  if (m) acc[m[1]] = m[2]
  return acc
}

function parseLink(link) {
  try {
    var m         =  link.match(/<?([^>]*)>(.*)/)
      , linkUrl   =  m[1]
      , parts     =  m[2].split(';')
    parts.shift()
    var info = parts
      .reduce(createObjects, {})
    info.url = linkUrl
    return info
  } catch (e) {
    return null
  }
}

export function parseLinkHeader(header) {
  if (!header) return null
  const obj = {}
  header.split(/,\s*</)
   .map(parseLink)
   .forEach(link => obj[link.rel] = link)
  return obj
}

export async function getPosts(streamUrl, max=20) {
  const posts = []
  let m
  let url = streamUrl
  // make it absolute if it's not already,
  // this makes our lives a lot easier when
  // resolving links
  if (!url.match(/^https?:\/\//)) {
    url = new URL(url, window.location.href)
  }
  let res
  do {
    res = await fetch(url)
    if (res.ok) {
      posts.push(res)
      const links = parseLinkHeader(res.headers.get('link'))
      const prev = links.previous
      const urlStr = prev ? prev.url : null
      url = urlStr && new URL(urlStr, url)
    } else {
      if (res.status === 404) {
        const err = new Error('Not Found')
        err.code = res.status
        throw err
      }
      const text = await res.text()
      console.warn('error fetching', text)
    }
  } while (res.ok && posts.length < max && url)
  return posts
}
