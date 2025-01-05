import { Injectable } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';
import { startWith, map, distinctUntilChanged, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService {
  // Standard breakpoints in pixels
  private readonly BREAKPOINTS = {
    XS: 320,   // Extra small devices
    SM: 576,   // Small devices
    MD: 768,   // Medium devices
    LG: 992,   // Large devices
    XL: 1200,  // Extra large devices
    XXL: 1400  // Extra extra large devices
  };

  // Observable streams for each screen size
  readonly isXs$: Observable<boolean> = this.createScreenSizeObservable(size => size < this.BREAKPOINTS.XS);
  readonly isSm$: Observable<boolean> = this.createScreenSizeObservable(size => size >= this.BREAKPOINTS.XS && size < this.BREAKPOINTS.SM);
  readonly isMd$: Observable<boolean> = this.createScreenSizeObservable(size => size >= this.BREAKPOINTS.SM && size < this.BREAKPOINTS.MD);
  readonly isLg$: Observable<boolean> = this.createScreenSizeObservable(size => size >= this.BREAKPOINTS.MD && size < this.BREAKPOINTS.LG);
  readonly isXl$: Observable<boolean> = this.createScreenSizeObservable(size => size >= this.BREAKPOINTS.LG && size < this.BREAKPOINTS.XL);
  readonly isXxl$: Observable<boolean> = this.createScreenSizeObservable(size => size >= this.BREAKPOINTS.XL);

  // Observable for current screen size category
  readonly screenSize$: Observable<string> = this.createScreenSizeObservable(size => {
    if (size < this.BREAKPOINTS.XS) return 'XS';
    if (size < this.BREAKPOINTS.SM) return 'SM';
    if (size < this.BREAKPOINTS.MD) return 'MD';
    if (size < this.BREAKPOINTS.LG) return 'LG';
    if (size < this.BREAKPOINTS.XL) return 'XL';
    return 'XXL';
  });

  // Observable for exact window width
  readonly windowWidth$: Observable<number> = fromEvent(window, 'resize').pipe(
    startWith(null),
    map(() => window.innerWidth),
    distinctUntilChanged(),
    shareReplay(1)
  );

  private createScreenSizeObservable<T>(checkFn: (size: number) => T): Observable<T> {
    return fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => checkFn(window.innerWidth)),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  // Synchronous methods for immediate checks
  isXs(): boolean {
    return window.innerWidth < this.BREAKPOINTS.XS;
  }

  isSm(): boolean {
    return window.innerWidth >= this.BREAKPOINTS.XS && window.innerWidth < this.BREAKPOINTS.SM;
  }

  isMd(): boolean {
    return window.innerWidth >= this.BREAKPOINTS.SM && window.innerWidth < this.BREAKPOINTS.MD;
  }

  isLg(): boolean {
    return window.innerWidth >= this.BREAKPOINTS.MD && window.innerWidth < this.BREAKPOINTS.LG;
  }

  isXl(): boolean {
    return window.innerWidth >= this.BREAKPOINTS.LG && window.innerWidth < this.BREAKPOINTS.XL;
  }

  isXxl(): boolean {
    return window.innerWidth >= this.BREAKPOINTS.XL;
  }

  getCurrentScreenSize(): string {
    const width = window.innerWidth;
    if (width < this.BREAKPOINTS.XS) return 'XS';
    if (width < this.BREAKPOINTS.SM) return 'SM';
    if (width < this.BREAKPOINTS.MD) return 'MD';
    if (width < this.BREAKPOINTS.LG) return 'LG';
    if (width < this.BREAKPOINTS.XL) return 'XL';
    return 'XXL';
  }

  // Helper method to check if screen is larger than a given breakpoint
  isLargerThan(breakpoint: keyof typeof this.BREAKPOINTS): boolean {
    return window.innerWidth >= this.BREAKPOINTS[breakpoint];
  }

  // Helper method to check if screen is smaller than a given breakpoint
  isSmallerThan(breakpoint: keyof typeof this.BREAKPOINTS): boolean {
    return window.innerWidth < this.BREAKPOINTS[breakpoint];
  }
}