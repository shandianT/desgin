// @shandiant/tokens/json：tokens.json 的全量产物，含 $meta、base、semantic、platforms 四层。
export interface TokenMeta { name: string; version: string; updated: string; status: string; [k: string]: unknown }
export type TokenTree = { [key: string]: TokenTree | string | number };
declare const tokens: { $meta: TokenMeta; base: TokenTree; semantic: TokenTree; platforms: TokenTree };
export default tokens;
