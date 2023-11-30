import { LogObject } from "@tools/logger.ts";
import { expect } from "../dependencies.ts";

Deno.test(
  "logObject.setErrorFields() sets error.code when receiving an error with a defined code",
  () => {
    const error = new Error("Oops!") as Error & { code: string };
    error.code = "1234";
    const logObject = new LogObject(error);

    expect(logObject["error.code"]).to.equal(error.code);
  },
);

Deno.test(
  "logObject.setErrorFields() sets error.id when receiving an error with a defined id",
  () => {
    const error = new Error("Oops!") as Error & { id: string };
    error.id = "abcd-efgh";
    const logObject = new LogObject(error);

    expect(logObject["error.id"]).to.equal(error.id);
  },
);

Deno.test(
  "logObject.setErrorFields() sets error.message when receiving an error with a defined message",
  () => {
    const error = new Error("Oops!");
    const logObject = new LogObject(error);

    expect(logObject["error.message"]).to.equal(error.message);
  },
);

Deno.test("logObject.setErrorFields() sets error.stack when receiving an error", () => {
  const error = new TypeError("Oops!");
  const logObject = new LogObject(error);

  expect(logObject["error.stack_trace"]?.[0].fileName).to.include("logger.test.ts");
});

Deno.test("logObject.setErrorFields() sets error.type when receiving an error", () => {
  const error = new TypeError("Oops!");
  const logObject = new LogObject(error);

  expect(logObject["error.type"]).to.equal("TypeError");
});
