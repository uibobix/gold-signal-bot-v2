/** Resolved on Cloudflare Workers bundles (`@cloudflare/vite-plugin`). */
declare module "cloudflare:workers" {
  export const env: {
    TWELVEDATA_API_KEY?: string;
    [key: string]: string | undefined;
  };
}
