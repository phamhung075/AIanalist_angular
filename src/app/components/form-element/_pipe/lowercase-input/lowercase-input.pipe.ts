import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appLowercaseInput]',
  standalone: true,
})
export class LowercaseInputPipe {
  constructor(private el: ElementRef, private control: NgControl) { }

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const lowerCaseValue = input.value.toLowerCase();
    this.el.nativeElement.value = lowerCaseValue;
  }
}
