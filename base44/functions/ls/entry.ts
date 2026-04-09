import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const files = [];
        for await (const dirEntry of Deno.readDir('src/components/public')) {
            files.push(dirEntry.name);
        }
        return Response.json({ files });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});