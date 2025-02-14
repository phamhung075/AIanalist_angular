import {
	CdkDragDrop,
	DragDropModule,
	moveItemInArray,
	transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
	Item,
	SubBranchItemComponent,
} from '@ui/shared/components/sub-branch-item/sub-branch-item.component';

@Component({
	selector: 'app-branch-display2',
	imports: [CommonModule, SubBranchItemComponent, DragDropModule],
	templateUrl: './branch-display2.component.html',
	styleUrl: './branch-display2.component.scss',
})
export class BranchDisplay2Component {
	public root: Item;
	public root_2: Item;
	public root_3: Item;
	public board: Item[];
	public states: string[];

	// Add index signature to allow string indexing
	[key: string]: any;

	constructor() {
		// Initialize root items
		this.root = {
			uId: 'root',
			name: 'Root',
			children: [],
			type: 'default',
		};

		this.root_2 = {
			uId: 'root_2',
			name: 'Root 2',
			children: [],
			type: 'default',
		};

		this.root_3 = {
			uId: 'root_3',
			name: 'Root 3',
			children: [],
			type: 'default',
		};

		this.board = [this.root, this.root_2, this.root_3];
		this.states = ['root', 'root_2', 'root_3'];
	}

	public addItem(): void {
		const randstr = Math.random().toString(36).substr(2, 5);
		const newItem: Item = {
			uId: randstr,
			name: '# ' + randstr,
			children: [],
			type: 'default',
		};
		this.root.children.push(newItem);
	}

	public generateParent(item: Item): void {
		item.children.forEach((childItem) => {
			childItem.parent = item;
			if (childItem.children.length > 0) {
				this.generateParent(childItem);
			}
		});
	}

	public connectedTo2(branches: string[]): string[] {
		let ids: string[] = [];
		branches.forEach((branch) => {
			// Now we can safely access this[branch] since we have an index signature
			const item = this[branch] as Item;
			if (item) {
				ids = ids.concat(this.getIdsRecursive(item).reverse());
			}
		});
		return ids;
	}

	private getIdsRecursive(item: Item): string[] {
		let ids = [item.uId];
		item.children.forEach((childItem) => {
			ids = ids.concat(this.getIdsRecursive(childItem));
		});
		return ids;
	}

	public onDragDrop(event: CdkDragDrop<Item[]>): void {
		if (event.previousContainer === event.container) {
			moveItemInArray(
				event.container.data,
				event.previousIndex,
				event.currentIndex
			);
		} else {
			transferArrayItem(
				event.previousContainer.data,
				event.container.data,
				event.previousIndex,
				event.currentIndex
			);
		}
	}
}
