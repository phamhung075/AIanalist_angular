import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class LoadingState implements OnDestroy {
	private loadingMap = new BehaviorSubject<Map<string, boolean>>(new Map());

	setLoading(id: string, isLoading: boolean): void {
		const currentMap = this.loadingMap.value;
		currentMap.set(id, isLoading);
		this.loadingMap.next(new Map(currentMap));
	}

	isLoading(id: string): Observable<boolean> {
		return this.loadingMap.pipe(
			map((loadingMap: Map<string, boolean>) => loadingMap.get(id) ?? false)
		);
	}

	ngOnDestroy() {
		this.loadingMap.complete();
	}

	// Optional: Method to clear all loading states
	clearAll() {
		this.loadingMap.next(new Map());
	}
}
