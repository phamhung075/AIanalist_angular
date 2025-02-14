// tree.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeNode } from '@ui/shared/models/tree-node.model';
import {
	CdkDrag,
	CdkDragDrop,
	CdkDropList,
	DragDropModule,
	moveItemInArray,
	transferArrayItem,
} from '@angular/cdk/drag-drop';
import { TreeService } from 'src/app/services/tree/tree.service';

@Component({
	selector: 'app-tree',
	standalone: true,
	imports: [CommonModule, FormsModule, DragDropModule],
	template: `
		<div
			class="tree-node"
			[class.root-node]="isRoot"
			[class.has-children]="node.children.length > 0"
		>
			<div
				class="node-content"
				cdkDrag
				[cdkDragData]="node"
				(cdkDragStarted)="onDragStarted()"
				(cdkDragEnded)="onDragEnded()"
			>
				<div class="connector-line" [class.last-child]="isLastChild">
					<div class="horizontal-connector"></div>
				</div>
				<div class="node-status-indicator" *ngIf="!isRoot">
					{{ node.children.length > 0 ? '📁' : '📄' }}
				</div>
				<div class="root-indicator" *ngIf="isRoot">🌳</div>
				<input
					[(ngModel)]="node.value"
					[placeholder]="isRoot ? 'Root Node' : 'Enter value'"
					[class.root-input]="isRoot"
				/>
				<div class="buttons">
					<button
						class="circle-button delete"
						*ngIf="!isRoot"
						(click)="deleteNode()"
					>
						×
					</button>
					<button
						class="circle-button add"
						(click)="addChild()"
						[class.root-button]="isRoot"
					>
						+
					</button>
					<button
						class="circle-button up-level"
						*ngIf="!isRoot"
						(click)="moveUpLevel()"
						title="Move to upper level"
					>
						↑
					</button>
					<div class="drag-handle" cdkDragHandle>☰</div>
				</div>
			</div>

			<div
				class="children"
				*ngIf="node.children.length > 0"
				cdkDropList
				[id]="dropListId"
				[cdkDropListData]="node.children"
				[cdkDropListConnectedTo]="dropListIds"
				(cdkDropListDropped)="drop($event)"
				[cdkDropListEnterPredicate]="canDrop"
			>
				<div class="children-container">
					<div
						class="branch-line"
						[class.has-multiple]="node.children.length > 1"
						[class.root-branch]="isRoot"
					></div>
					<app-tree
						*ngFor="let child of node.children; let last = last"
						[node]="child"
						[isLastChild]="last"
						[isRoot]="false"
						[dropListIds]="dropListIds"
						(onDelete)="removeChild($event)"
						(registerDropList)="onRegisterDropList($event)"
					></app-tree>
				</div>
			</div>
		</div>
	`,
	styles: [
		`
			.tree-node {
				position: relative;
				padding-left: 30px;
				margin: 5px 0 0 25px;
			}

			.root-node {
				margin-left: 0;
				padding-left: 10px;
			}

			.root-node > .node-content {
				background-color: #f0f7ff;
				border: 2px solid #2196f3;
				padding: 10px;
				border-radius: 8px;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			}

			.has-children > .node-content {
				background-color: #f5f5f5;
				border: 1px solid #e0e0e0;
			}

			.node-content {
				display: flex;
				align-items: center;
				gap: 8px;
				position: relative;
				cursor: move;
				background: white;
				border-radius: 4px;
				padding: 5px;
				transition: all 0.2s ease;
			}

			.node-status-indicator {
				font-size: 16px;
				width: 20px;
				text-align: center;
			}

			.root-indicator {
				font-size: 20px;
				margin-right: 8px;
			}

			.root-input {
				font-weight: bold;
				font-size: 16px;
				color: #1976d2;
				background-color: #fff;
			}

			.root-button {
				background-color: #2196f3 !important;
				width: 24px !important;
				height: 24px !important;
				font-size: 16px !important;
			}

			.node-content.cdk-drag-preview {
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
			}

			.node-content.cdk-drag-placeholder {
				opacity: 0.5;
			}

			.drag-handle {
				cursor: move;
				color: #666;
				user-select: none;
			}

			.connector-line {
				position: absolute;
				left: -55px;
				top: 50%;
				width: 55px;
				height: 2px;
			}

			.horizontal-connector {
				position: absolute;
				left: 0;
				width: 100%;
				height: 2px;
				background-color: #ccc;
			}

			.connector-line.last-child::before {
				content: '';
				position: absolute;
				left: 0;
				top: -12px;
				width: 4px;
				height: 14px;
				background-color: #ccc;
			}

			.children-container {
				position: relative;
				padding-left: -1px;
			}

			.branch-line {
				position: absolute;
				left: 0;
				top: 0;
				width: 4px;
				height: calc(100% - 20px);
				background-color: #ccc;
			}

			.root-branch {
				background-color: #2196f3;
			}

			.branch-line.has-multiple {
				height: calc(100% - 15px);
			}

			input {
				padding: 5px;
				border: 1px solid #ccc;
				border-radius: 4px;
				width: 150px;
			}

			.buttons {
				display: flex;
				gap: 5px;
			}

			.circle-button {
				width: 20px;
				height: 20px;
				border-radius: 50%;
				border: none;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				font-size: 14px;
				padding: 0;
			}

			.delete {
				background-color: #ff4444;
				color: white;
			}

			.add {
				background-color: #44ff44;
				color: white;
			}

			.up-level {
				background-color: #4444ff;
				color: white;
			}

			.cdk-drop-list-dragging .node-content:not(.cdk-drag-placeholder) {
				transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
			}
		`,
	],
})
export class TreeComponent implements OnInit {
	@Input() node!: TreeNode;
	@Input() isLastChild = false;
	@Input() isRoot = true;
	@Input() dropListIds: string[] = [];
	@Output() onDelete = new EventEmitter<string>();
	@Output() registerDropList = new EventEmitter<string>();

	dropListId = `drop-list-${Math.random().toString(36).substring(2)}`;
	private hasBeenInitialized = false;

	constructor(private treeService: TreeService) {}

	ngOnInit() {
		if (!this.hasBeenInitialized) {
			this.registerDropList.emit(this.dropListId);
			console.log('Tree Component Initialized:', {
				nodeId: this.node.id,
				value: this.node.value,
				children: this.node.children.length,
			});
			this.hasBeenInitialized = true;
		}
	}

	canDrop = (drag: CdkDrag, drop: CdkDropList) => {
		const dragData = drag.data as TreeNode;
		const dropData = this.node; // Current node where we're trying to drop

		// Prevent dropping on itself or its descendants and root
		if (
			dragData.id === dropData.id ||
			this.isDescendant(dragData, dropData) ||
			dropData.id === 'root'
		) {
			return false;
		}
		return true;
	};

	private isDescendant(dragNode: TreeNode, targetNode: TreeNode): boolean {
		return targetNode.children.some(
			(child) => child.id === dragNode.id || this.isDescendant(dragNode, child)
		);
	}

	drop(event: CdkDragDrop<TreeNode[]>) {
		const draggedNode = event.item.data as TreeNode;

		if (event.previousContainer === event.container) {
			// Moving within the same container
			moveItemInArray(
				event.container.data,
				event.previousIndex,
				event.currentIndex
			);
		} else {
			// Moving to a different container
			const success = this.treeService.moveNode(
				draggedNode.id,
				this.node.id,
				'inside',
				event.currentIndex // Pass the current index for position-based insertion
			);

			if (success) {
				console.log('Node moved successfully to:', {
					targetNode: this.node.value,
					position: event.currentIndex,
				});
			}
		}
	}

	moveUpLevel() {
		const currentParent = this.treeService.getParentNode(this.node.id);
		if (!currentParent) {
			console.log('Cannot move up: No parent found');
			return;
		}

		const grandParent = this.treeService.getParentNode(currentParent.id);
		if (!grandParent) {
			console.log('Cannot move up: No grandparent found');
			return;
		}

		// Find the index where the current parent is in the grandparent's children
		const parentIndex = grandParent.children.findIndex(
			(child) => child.id === currentParent.id
		);

		if (parentIndex === -1) {
			console.log('Cannot move up: Parent index not found');
			return;
		}

		// Move the node one level up
		const success = this.treeService.moveNode(
			this.node.id,
			grandParent.id,
			'inside',
			parentIndex + 1 // Insert after the current parent
		);

		if (success) {
			console.log('Node moved up successfully:', {
				nodeId: this.node.id,
				newParentId: grandParent.id,
				position: parentIndex + 1,
			});
		}
	}

	// Update the tree service to include better logging
	removeChild(childId: string) {
		const index = this.node.children.findIndex((child) => child.id === childId);
		if (index !== -1) {
			const removedNode = this.node.children[index];
			this.node.children.splice(index, 1);
			console.log('Removed child:', {
				childId,
				parentId: this.node.id,
				parentValue: this.node.value,
			});
		}
	}

	addChild() {
		const newNode: TreeNode = {
			id: Date.now().toString(),
			value: 'New Node',
			children: [],
		};
		this.treeService.updateNodeMaps(newNode, this.node.id);
		this.node.children.push(newNode);
	}

	deleteNode() {
		this.onDelete.emit(this.node.id);
	}

	onDragStarted() {
		document.body.classList.add('dragging');
	}

	onDragEnded() {
		document.body.classList.remove('dragging');
	}

	onRegisterDropList(childDropListId: string) {
		if (!this.dropListIds.includes(childDropListId)) {
			this.dropListIds.push(childDropListId);
			this.registerDropList.emit(childDropListId);
		}
	}
}
