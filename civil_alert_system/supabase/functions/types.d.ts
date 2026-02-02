// Ambient typings for Supabase Edge Functions in VS Code without the Deno extension.
// These are editor-only shims so TypeScript doesn't flag Deno/URL imports.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

declare module "https://esm.sh/@supabase/supabase-js@2" {
  // Keep this as `any` so we don't need node/npm type resolution in this workspace.
  export const createClient: any;
}
