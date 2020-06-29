import marked from 'marked'
import insane from 'insane'
import * as TimeStreams from './client'

function isLocalhost(hostname) {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)
}

function normalizeStream(streamName) {
  const [user, path] = streamName.split('@')
  let pathParts = path.split(':')
  let host = pathParts.shift()
  if (user) pathParts.unshift(user)
  const isLocal = isLocalhost(host)
  const proto = isLocal ? 'http' : 'https'
  const portPart = isLocal ? ':4545' : ''
  return `${proto}://${host}${portPart}/${pathParts.join('/')}`
}

function getStream() {
  const path = window.location.pathname.slice(1)
  if (path.length > 0) {
    const streamName = path.split('/')[0]
    const url = new URL(normalizeStream(streamName))
    return { url: url.href, name: streamName }
  }
}

function render(post) {
  return `
  <h3>${post.date.toISOString()}</h3>
  ${post.links.previous ? `<div class="nav"><a href="${post.links.previous.absoluteUrl}">&larr; earlier</a></div>` : '' }
  ${post.body}
  `
}

async function toPostObject(res, stream) {
  const type = res.headers.get('content-type')
  const date = new Date(res.headers.get('post-time'))
  const links = TimeStreams.parseLinkHeader(res.headers.get('link'))

  if (links.previous) {
    const prevUrl = links.previous.url
    // console.log("raw url:", prevUrl)
    const newUrl = new URL(prevUrl, res.url)
    // console.log("new absolute timestream url:", newUrl)
    const postPath = newUrl.href.replace(stream.url,'')
    // console.log("stream name", stream.name, "post path", postPath)
    links.previous.absoluteUrl = `/${stream.name}${postPath}`
  }

  let body
  if (type.includes('text')) {
    body = await res.text()
    if (type.includes('markdown')) {
      // strip front matter
      body = body.replace(/^---[\s\S]+?---/,'')
      // convert to html and santize
      body = insane(marked(body))
    }
    if (type.includes('html')) {
      body = insane(body)
    }
  } else if (type.includes('image')) {
    const blobUrl = URL.createObjectURL(await res.blob())
    body = `<a href="${blobUrl}"><img src="${blobUrl}"></a>`
  }

  return {
    type,
    date,
    body,
    links
  }
}

window.addEventListener('DOMContentLoaded', async () => {

  // fix silly parcel-hackery links
  const els = document.querySelectorAll('[data-stream]')
  for (const el of els) el.href = el.attributes['data-stream'].value

  const stream = getStream()
  const postID = window.location.pathname.slice(1).split('/')[1]
  if (!stream) {
    document.querySelector('#no-stream').style.display = 'block'
  } else {
    const postUrl = postID ? `${stream.url}/${postID}` : stream.url
    let responses
    try {
      responses = await TimeStreams.getPosts(postUrl, 1)
    } catch (err) {
      if (err.code === 404) {
        document.querySelector('#not-found').style.display = 'block'
      } else {
        throw err
      }
    }
    const posts = await Promise.all(responses.map(r => toPostObject(r, stream)))
    // convert
    const post = posts[0]
    // just show the first post for now
    if (post) {
      const postEl = document.querySelector('#post')
      postEl.innerHTML = render(post)
    }
  }
})
