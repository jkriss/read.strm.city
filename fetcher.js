import marked from "marked";
import sanitize from "insane";
// import { Remarkable } from "remarkable";
// import createDOMPurify from "dompurify";
import * as TimeStreams from "./client";

// // const { sanitize } = createDOMPurify(window);
// function sanitize(str) {
//   return str;
// }

function isLocalhost(hostname) {
  return ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);
}

function normalizeStream(streamName) {
  const [user, path] = streamName.split("@");
  let pathParts = path.split(":");
  let host = pathParts.shift();
  if (user) pathParts.unshift("@" + user);
  const isLocal = isLocalhost(host);
  const proto = isLocal ? "http" : "https";
  const portPart = isLocal ? ":4545" : "";
  return `${proto}://${host}${portPart}/${pathParts.join("/")}`;
}

export function getStream() {
  const path = window.location.pathname.slice(1);
  if (path.length > 0) {
    const streamName = path.split("/")[0];
    const url = new URL(normalizeStream(streamName));
    return { url: url.href, name: streamName };
  }
}

export async function toPostObject(res, stream) {
  const type = res.headers.get("content-type");
  const date = new Date(res.headers.get("post-time"));
  const links = TimeStreams.parseLinkHeader(res.headers.get("link"));

  if (!links) console.warn("No Link header. Is it allowed by CORS?");

  if (links && links.previous) {
    const prevUrl = links.previous.url;
    // console.log("raw url:", prevUrl)
    const newUrl = new URL(prevUrl, res.url);
    // console.log("new absolute timestream url:", newUrl)
    const postPath = newUrl.href.replace(stream.url, "");
    // console.log("stream name", stream.name, "post path", postPath)
    links.previous.absoluteUrl = `/${stream.name}${postPath}`;
  }

  let body;
  if (type.includes("text")) {
    body = await res.text();
    if (type.includes("markdown")) {
      // strip front matter
      body = body.replace(/^---[\s\S]+?---/, "");
      // convert to html and santize
      body = sanitize(marked(body));
    }
    if (type.includes("html")) {
      body = sanitize(body);
    }
  } else if (type.includes("image")) {
    const blobUrl = URL.createObjectURL(await res.blob());
    body = `<a href="${blobUrl}"><img src="${blobUrl}"></a>`;
  }

  return {
    type,
    date,
    body,
    links,
  };
}
