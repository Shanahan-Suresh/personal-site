import type { Page } from "@playwright/test";

/** Encoded response bytes and headers, including lazy images in WebKit. */
export function trackTransfers(page: Page) {
  const measurements: Promise<number>[] = [];
  page.on("requestfinished", (request) => {
    measurements.push(
      request
        .sizes()
        .then(
          ({ responseBodySize, responseHeadersSize }) =>
            responseBodySize + responseHeadersSize,
        ),
    );
  });
  return async () =>
    (await Promise.all(measurements)).reduce((total, size) => total + size, 0);
}
