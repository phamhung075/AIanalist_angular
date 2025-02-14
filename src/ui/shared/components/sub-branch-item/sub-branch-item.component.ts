import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
export interface Item {
	uId: string;
	name: string;
	type: 'default' | 'todolist' | 'todo';
	children: Item[];
	parent?: Item;
	value?: boolean;
}
@Component({
	selector: 'app-sub-item',
	imports: [CommonModule],
	template: ``,
	styleUrl: './sub-branch-item.component.scss',
})
export class SubBranchItemComponent {
	@Input() item!: Item;
	@Input() connectedTo2!: string[];
	@Output() itemDrop = new EventEmitter<CdkDragDrop<Item[]>>();

	public onDragDrop(event: CdkDragDrop<Item[]>): void {
		this.itemDrop.emit(event);
	}

	public delItem(): void {
		if (this.item.parent && Array.isArray(this.item.parent.children)) {
			const index = this.item.parent.children.indexOf(this.item);
			if (index > -1) {
				this.item.parent.children.splice(index, 1);
			}
		}
	}
}
