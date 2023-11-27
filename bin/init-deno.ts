import { defineCommandOptions } from "https://cdn.jsdelivr.net/gh/toridoriv/my-dev-toolkit/tools/command.ts";

export default defineCommandOptions({
  name: "init-deno",
  description: "Initiates a Deno project.",
  arguments: [{ name: "path", type: "string" }],
  async action(_options, path) {
    const vscodePath = path + "./vscode/";
    const extensions = await getExtensionsFile();
    const settings = await getSettingsFile();

    extensions.filename = vscodePath + extensions.filename;
    settings.filename = vscodePath + settings.filename;

    Deno.mkdirSync(vscodePath);
    Deno.mkdirSync(path, { recursive: true });
    Deno.writeTextFileSync(extensions.filename, extensions.content);
    Deno.writeTextFileSync(settings.filename, settings.content);
  },
});

async function getSettingsFile() {
  const filename = "settings.json";
  const response = await fetch(
    `https://raw.githubusercontent.com/toridoriv/my-dev-toolkit/main/.vscode/${filename}`,
  );

  return { filename, content: await response.text() };
}

async function getExtensionsFile() {
  const filename = "extensions.json";
  const response = await fetch(
    `https://raw.githubusercontent.com/toridoriv/my-dev-toolkit/main/.vscode/${filename}`,
  );

  return { filename, content: await response.text() };
}
