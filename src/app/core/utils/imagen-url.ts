import { environment } from '../../../environments/environment';

const PLACEHOLDER = 'images/placeholder.svg';

export function imagenSrc(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER;
  return url.startsWith('http') ? url : environment.serverUrl + url;
}