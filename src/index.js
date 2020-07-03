import stamp from "template-stamper";
import { getStream, toPostObject } from "./fetcher";
import { getPosts } from "./client";

window.addEventListener("DOMContentLoaded", async () => {
  const rootEl = document.querySelector("#blog");
  const hash = window.location.hash === "" ? undefined : window.location.hash;
  const templateName = hash || "#single-post";
  let template = document.querySelector(templateName);

  const maxPosts = template.getAttribute("data-post-count") || 10;

  function render(data) {
    rootEl.innerHTML = "";
    rootEl.appendChild(stamp(template, data));
  }

  const stream = getStream();

  const postID = window.location.pathname.slice(1).split("/")[1];

  if (stream) {
    // stream.friendlyName = stream.name.replace(/:/g, " / ");
    const [_, user, path] = stream.name.match(/([^@]+)?@[^:]+:(.+)/);
    stream.friendlyName = `${user ? `${user} / ` : ""}${path.replace(
      /:/g,
      " / "
    )}`;
    stream.href = `${stream.name}${window.location.hash}`;

    render({ loading: true, stream });

    const postUrl = postID ? `${stream.url}/${postID}` : stream.url;
    let responses;
    try {
      responses = await getPosts(postUrl, maxPosts);
    } catch (err) {
      render({ stream });
    }
    const posts = await Promise.all(
      (responses || []).map((r) => toPostObject(r, stream))
    );
    // convert
    posts.forEach((p) => {
      p.date = p.date.toISOString();
      p.content = p.body;
    });
    const lastPost = posts[posts.length - 1];
    render({ stream, posts, lastPost });
  } else {
    render({});
  }
});
