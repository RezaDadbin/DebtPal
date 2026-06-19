(function () {
  function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(`${name}=`)) {
        return decodeURIComponent(trimmed.slice(name.length + 1));
      }
    }
    return "";
  }

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : getCookie("csrftoken");
  }

  window.debtpalFetch = function debtpalFetch(input, init) {
    const options = Object.assign({ credentials: "same-origin" }, init || {});
    const method = (options.method || "GET").toUpperCase();

    if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
      const headers = new Headers(options.headers || {});
      if (!headers.has("X-CSRFToken")) {
        headers.set("X-CSRFToken", getCsrfToken());
      }
      options.headers = headers;
    }

    return fetch(input, options);
  };
}());
