import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cleanFakePathGetFileName',
  standalone: true,
})
export class FilenamePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    return value.replace(/.*[\/\\]/, '');
  }

}
