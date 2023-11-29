import * as validations from "@tools/validations.ts";
import { expect } from "../dependencies.ts";

Deno.test("isHttpUrl() returns true when receives a valid url with http protocol", () => {
  const urls = [
    "http://www.example.org",
    "http://foo.bar/?q=Test%20URL-encoded%20stuff",
    "http://a.b-c.de",
    "http://223.255.255.254",
    "http://142.42.1.1:8080/",
    "http://www.example.com/foo/?bar=baz&inga=42&quux",
    "http://foo.com/blah_blah_(wikipedia)_(again)",
  ];

  urls.forEach((url) => {
    const isValid = validations.isHttpUrl(url);

    expect(isValid).to.equal(true, `expected isHttpUrl(${url}) to return true`);
  });
});

Deno.test(
  "isHttpUrl() returns true when receives a valid url with https protocol",
  () => {
    const urls = [
      "https://www.example.org",
      "https://foo.bar/?q=Test%20URL-encoded%20stuff",
      "https://a.b-c.de",
      "https://223.255.255.254",
      "https://142.42.1.1:8080/",
      "https://www.example.com/foo/?bar=baz&inga=42&quux",
      "https://foo.com/blah_blah_(wikipedia)_(again)",
    ];

    urls.forEach((url) => {
      const isValid = validations.isHttpUrl(url);

      expect(isValid).to.equal(true, `expected isHttpUrl(${url}) to return true`);
    });
  },
);

Deno.test(
  "isHttpUrl() returns false when receives a valid url with file protocol",
  () => {
    const urls = [
      "file://www.example.org",
      "file://foo.bar/?q=Test%20URL-encoded%20stuff",
      "file://a.b-c.de",
      "file://223.255.255.254",
      "file://142.42.1.1:8080/",
      "file://www.example.com/foo/?bar=baz&inga=42&quux",
      "file://foo.com/blah_blah_(wikipedia)_(again)",
    ];

    urls.forEach((url) => {
      const isValid = validations.isHttpUrl(url);

      expect(isValid).to.equal(false, `expected isHttpUrl(${url}) to return false`);
    });
  },
);
