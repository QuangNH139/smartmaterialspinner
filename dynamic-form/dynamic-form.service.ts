import { Injectable } from '@angular/core';
import { from, isObservable, Observable, of, firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DynamicFormService {
  resolveOptions(
    src?: any[] | Promise<any[]> | Observable<any[]> | ((q?: string) => any[] | Promise<any[]> | Observable<any[]>) ,
    query?: string
  ): Promise<any[]> {
    if (!src) return Promise.resolve([]);

    try {
      const value = typeof src === 'function' ? src(query) : src;

      if (value instanceof Promise) return value;
      if (isObservable(value)) {
        return firstValueFrom(value as Observable<any[]>).catch(() => []);
      }
      if (Array.isArray(value)) return Promise.resolve(value);
    } catch (e) {
      return Promise.resolve([]);
    }

    return Promise.resolve([]);
  }
}