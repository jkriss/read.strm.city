import stamp from "template-stamper";
import { getStream, toPostObject } from "./fetcher";
import { getPosts } from "./client";

window.addEventListener("DOMContentLoaded", async () => {
  const rootEl = document.querySelector("#blog");
  const template = document.querySelector("#page");

  function render(data) {
    rootEl.innerHTML = "";
    rootEl.appendChild(stamp(template, data));
  }

  const stream = getStream();

  const postID = window.location.pathname.slice(1).split("/")[1];

  if (stream) {
    stream.friendlyName = stream.name.replace(/:/g, " / ");

    render({ loading: true, stream });

    const postUrl = postID ? `${stream.url}/${postID}` : stream.url;
    let responses;
    try {
      responses = await getPosts(postUrl, 1);
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
    render({ stream, posts });
  } else {
    render({});
  }
});
