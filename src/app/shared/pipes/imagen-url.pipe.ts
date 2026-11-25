import { Pipe, PipeTransform } from '@angular/core';
import { imagenSrc } from '../../core/utils/imagen-url';

@Pipe({ name: 'imagenUrl' })
export class ImagenUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    return imagenSrc(url);
  }
}