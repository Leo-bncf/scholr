Deno.serve(async (req) => {
  const files = [];
  try {
    for await (const dirEntry of Deno.readDir('components/public')) {
      files.push(dirEntry.name);
    }
  } catch(e) {
    return Response.json({ error: e.message });
  }
  return Response.json({ files });
});