interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css?url" {
  const href: string;
  export default href;
}

declare module "node:process" {
  const process: {
    env: Record<string, string | undefined>;
  };
  export default process;
}
